
using System.Collections.Concurrent;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure.Configuration;
using BjjEire.SharedKernel.Logging;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

namespace BjjEire.Infrastructure.Caching;

public class MemoryCacheBase(IMemoryCache cache, CacheOptions cacheOptions, ILogger<MemoryCacheBase> logger) : ICacheBase {
    private readonly IMemoryCache _cache = cache;
    private readonly CacheOptions _cacheOptions = cacheOptions;
    private readonly ILogger<MemoryCacheBase> _logger = logger;
    private static readonly CancellationTokenSource ResetCacheToken = new();
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _cacheEntries = new();

    public async Task ClearAsync(bool publisher = true) {
        _logger.LogInformation(ApplicationLogEvents.Cache.ClearAttempt, "Attempting to clear the entire cache.");

        foreach (var cacheEntryKey in _cacheEntries.Keys.ToList()) {
            _cache.Remove(cacheEntryKey);
        }

        await ResetCacheToken.CancelAsync();
        _logger.LogDebug(ApplicationLogEvents.Cache.ResetTokenSignaled, "Cancellation token signaled for cache reset.");
        ResetCacheToken.Dispose();
        _logger.LogDebug(ApplicationLogEvents.Cache.NewResetToken, "New cache reset cancellation token source created.");

        _cacheEntries.Clear();
        _logger.LogInformation(ApplicationLogEvents.Cache.ClearSuccess, "Cache Clear operation completed. Signaled reset token and cleared internal key tracking.");
    }


    public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire) => GetAsync(key, acquire, _cacheOptions.DefaultCacheTimeMinutes);

    public virtual async Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) {
        _logger.LogDebug(ApplicationLogEvents.Cache.GetAttempt, "Attempting to get item with cache key {CacheKey}", key);

        if (_cache.TryGetValue(key, out T? cacheEntry)) {
            _logger.LogInformation(ApplicationLogEvents.Cache.Hit, "Cache hit for key {CacheKey}", key);
            return cacheEntry!;
        }

        _logger.LogInformation(ApplicationLogEvents.Cache.Miss, "Cache miss for key {CacheKey}. Attempting to acquire data using semaphore.", key);
        var semaphore = _cacheEntries.GetOrAdd(key, k => {
            _logger.LogDebug(ApplicationLogEvents.Cache.SemaphoreCreated, "Creating new semaphore for key {CacheKey}", k);
            return new SemaphoreSlim(1, 1);
        });

        await semaphore.WaitAsync();
        try {
            if (_cache.TryGetValue(key, out T? existingEntry)) {
                _logger.LogInformation(ApplicationLogEvents.Cache.HitAfterWait, "Cache hit after semaphore wait for key {CacheKey}. Item added by another operation.", key);
                cacheEntry = existingEntry;
            }
            else {
                _logger.LogInformation(ApplicationLogEvents.Cache.MissAcquire, "Cache miss after semaphore wait for key {CacheKey}. This thread will acquire and set the item.", key);
                ArgumentNullException.ThrowIfNull(acquire);
                cacheEntry = await acquire();
                var options = GetMemoryCacheEntryOptions(cacheTime);
                _ = _cache.Set(key, cacheEntry, options);
                _logger.LogInformation(ApplicationLogEvents.Cache.ItemSet, "Stored item with key {CacheKey} in cache. ExpirationType: {ExpirationType}, CacheTimeMinutes: {CacheTimeMinutes}",
                    key,
                    options.SlidingExpiration.HasValue ? "Sliding" : "Absolute",
                    cacheTime);
            }
        }
        finally {
            _ = semaphore.Release();
            _logger.LogDebug(ApplicationLogEvents.Cache.SemaphoreReleased, "Released semaphore for key {CacheKey}", key);
        }

        return cacheEntry!;
    }

    public Task RemoveAsync(string key, bool publisher = true) {
        _logger.LogInformation(ApplicationLogEvents.Cache.RemoveAttempt, "Attempting to remove item with cache key {CacheKey}", key);
        _cache.Remove(key);

        if (_cacheEntries.TryRemove(key, out _)) {
            _logger.LogDebug("Successfully removed key {CacheKey} from internal tracking dictionary.", key);
        }
        else {
            _logger.LogDebug("Key {CacheKey} not found in internal tracking dictionary during removal, or already removed.", key);
        }
        _logger.LogInformation(ApplicationLogEvents.Cache.RemoveSuccess, "Cache removal complete for key {CacheKey}.", key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, bool publisher = true) {
        _logger.LogInformation(ApplicationLogEvents.Cache.RemoveByPrefixAttempt, "Attempting to remove items with cache prefix {CachePrefix}", prefix);
        int itemsRemovedCount = 0;
        var entriesToRemove = _cacheEntries
            .Where(x => x.Key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Select(x => x.Key)
            .ToList();

        foreach (var key in entriesToRemove) {
            _logger.LogDebug(ApplicationLogEvents.Cache.RemoveByPrefixItem, "Removing item with key {CacheKey} matching prefix {CachePrefix}", key, prefix);
            _cache.Remove(key);
            if (_cacheEntries.TryRemove(key, out _)) {
                itemsRemovedCount++;
            }
        }
        _logger.LogInformation(ApplicationLogEvents.Cache.RemoveByPrefixCompleted, "Removed {ItemsRemovedCount} items with prefix {CachePrefix}", itemsRemovedCount, prefix);
        return Task.CompletedTask;
    }

    public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire) => SetAsync(key, acquire, _cacheOptions.DefaultCacheTimeMinutes);

    public async Task<T> SetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) {
        _logger.LogInformation(ApplicationLogEvents.Cache.SetAttempt, "Attempting to set/overwrite item with cache key {CacheKey}", key);

        var semaphore = _cacheEntries.GetOrAdd(key, k => {
            _logger.LogDebug(ApplicationLogEvents.Cache.SemaphoreCreated, "Creating new semaphore for key {CacheKey} during SetAsync.", k);
            return new SemaphoreSlim(1, 1);
        });

        await semaphore.WaitAsync();
        try {
            ArgumentNullException.ThrowIfNull(acquire);
            var cacheEntry = await acquire();
            var options = GetMemoryCacheEntryOptions(cacheTime);
            _ = _cache.Set(key, cacheEntry, options);
            _logger.LogInformation(ApplicationLogEvents.Cache.ItemSet, "Stored item with key {CacheKey} in cache via SetAsync. ExpirationType: {ExpirationType}, CacheTimeMinutes: {CacheTimeMinutes}",
                key,
                options.SlidingExpiration.HasValue ? "Sliding" : "Absolute",
                cacheTime);
            return cacheEntry;
        }
        finally {
            _ = semaphore.Release();
            _logger.LogDebug(ApplicationLogEvents.Cache.SemaphoreReleased, "Released semaphore for key {CacheKey} in SetAsync.", key);
        }
    }

    private MemoryCacheEntryOptions GetMemoryCacheEntryOptions(int cacheTime, bool useSliding = false) {
        var options = new MemoryCacheEntryOptions {
            Size = 1 // Assuming all items are size 1 for simplicity, adjust if using size limits.
        };
        if (useSliding) {
            options.SlidingExpiration = TimeSpan.FromMinutes(cacheTime);
        }
        else {
            options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheTime);
        }

        _ = options.AddExpirationToken(new CancellationChangeToken(ResetCacheToken.Token))
               .RegisterPostEvictionCallback(PostEvictionCallback);
        return options;
    }

    private void PostEvictionCallback(object? key, object? value, EvictionReason reason, object? state) {
        var cacheKey = key?.ToString() ?? "[UnknownKey]";
        if (reason != EvictionReason.Replaced && _cacheEntries.TryRemove(cacheKey, out _)) {
            _logger.LogDebug(ApplicationLogEvents.Cache.ItemEvicted, "Cache item {CacheKey} removed from tracking dictionary due to eviction reason: {EvictionReason}", cacheKey, reason);
        }
        _logger.LogInformation(ApplicationLogEvents.Cache.ItemEvicted, "Cache item evicted. Key: {CacheKey}, Reason: {EvictionReason}, HasValue: {HasValue}", cacheKey, reason, value != null);
    }
}
