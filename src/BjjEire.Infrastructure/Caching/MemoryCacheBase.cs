
using System.Collections.Concurrent;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

namespace BjjEire.Infrastructure.Caching;

public class MemoryCacheBase(IMemoryCache cache, CacheOptions cacheOptions, ILogger<MemoryCacheBase> logger) : ICacheBase {
    private readonly IMemoryCache _cache = cache; private readonly CacheOptions _cacheOptions = cacheOptions;
    private readonly ILogger<MemoryCacheBase> _logger = logger;
    private static CancellationTokenSource s_resetCacheToken = new();
    protected readonly ConcurrentDictionary<string, SemaphoreSlim> _cacheEntries = new();

    public Task Clear(bool publisher = true) {
        _logger.LogInformation("Attempting to clear the entire cache.");

        foreach (var cacheEntry in _cacheEntries.Keys.ToList()) {
            _cache.Remove(cacheEntry);
        }

        s_resetCacheToken.Cancel();
        _logger.LogDebug("Cancellation token signaled for cache reset.");
        s_resetCacheToken.Dispose();
        s_resetCacheToken = new CancellationTokenSource();
        _logger.LogDebug("New cancellation token source created.");
        _cacheEntries.Clear();
        _logger.LogInformation("Cache Clear operation completed. Signaled reset token and cleared internal tracking dictionary (tracked keys).");

        return Task.CompletedTask;

    }

    public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire) => GetAsync(key, acquire, _cacheOptions.DefaultCacheTimeMinutes);

    public virtual async Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) {
        _logger.LogDebug("Attempting to get item with key {CacheKey}", key);

        if (_cache.TryGetValue(key, out T? cacheEntry)) {
            _logger.LogInformation("Cache hit for key {CacheKey}", key);
            return cacheEntry!;
        }

        _logger.LogInformation("Cache miss for key {CacheKey}. Attempting to acquire data.", key);
        // Cache Stampede Protection
        var semaphore = _cacheEntries.GetOrAdd(key, k => {
            _logger.LogDebug("Creating new semaphore for key {CacheKey}", k);
            return new SemaphoreSlim(1, 1);
        });

        await semaphore.WaitAsync();
        try {
            if (!_cache.TryGetValue(key, out cacheEntry)) {
                _logger.LogInformation("Cache hit after wait for key {CacheKey}. Another thread added the item.", key);
                ArgumentNullException.ThrowIfNull(acquire);
                cacheEntry = await acquire();
                var options = GetMemoryCacheEntryOptions(cacheTime);
                _ = _cache.Set(key, cacheEntry, options);
                _logger.LogInformation("Stored item with key {CacheKey} in cache. Expiration: {ExpirationType} in {CacheTimeMinutes} minutes.",
                    key,
                    options.SlidingExpiration.HasValue ? "Sliding" : "Absolute",
                    cacheTime);
            }
        }
        finally {
            _ = semaphore.Release();
            _logger.LogDebug("Released semaphore for key {CacheKey}", key);
        }

        return cacheEntry!;
    }

    public Task RemoveAsync(string key, bool publisher = true) {
        _logger.LogInformation("Attempting to remove item with key {CacheKey}", key);
        _cache.Remove(key);

        _ = _cacheEntries.TryRemove(key, out _);

        _logger.LogInformation("Removal complete for key {CacheKey}.", key);

        // TODO: Add publish cache event if needed for distributed cache invalidation

        return Task.CompletedTask;
    }

    public Task RemoveByPrefix(string prefix, bool publisher = true) {
        _logger.LogInformation("Attempting to remove items with prefix {CachePrefix}", prefix);

        var entriesToRemove = _cacheEntries.Where(x => x.Key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        foreach (var cacheEntries in entriesToRemove) {
            _logger.LogDebug("Removing item with key {CacheKey}", cacheEntries.Key);
            _cache.Remove(cacheEntries.Key);
            _ = _cacheEntries.TryRemove(cacheEntries.Key, out _);

            _logger.LogInformation("Removed items with prefix {CachePrefix}.", prefix);
        }

        // TODO: Add publish cache event if needed for distributed cache invalidation

        return Task.CompletedTask;
    }

    public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire) => SetAsync(key, acquire, _cacheOptions.DefaultCacheTimeMinutes);

    public async Task<T> SetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) {
        _logger.LogInformation("Attempting to set/overwrite item with key {CacheKey}", key);

        var semaphore = _cacheEntries.GetOrAdd(key, k => {
            _logger.LogDebug("Creating new semaphore for key {CacheKey} during SetAsync.", k);
            return new SemaphoreSlim(1, 1);
        });

        await semaphore.WaitAsync();
        try {
            ArgumentNullException.ThrowIfNull(acquire);
            var cacheEntry = await acquire();
            var options = GetMemoryCacheEntryOptions(cacheTime);
            _ = _cache.Set(key, cacheEntry, options);
            _logger.LogInformation("Stored item with key {CacheKey} in cache via SetAsync. Expiration: {ExpirationType} in {CacheTimeMinutes} minutes.",
                key,
                options.SlidingExpiration.HasValue ? "Sliding" : "Absolute",
                cacheTime);
            _logger.LogInformation("Stored item with key {CacheKey} in cache via SetAsync", key);
            return cacheEntry;
        }
        finally {
            _ = semaphore.Release();
            _logger.LogDebug("Released semaphore for key {CacheKey} in SetAsync.", key);
        }

    }

    private MemoryCacheEntryOptions GetMemoryCacheEntryOptions(int cacheTime, bool useSliding = false) {
        var options = new MemoryCacheEntryOptions {
            Size = 1
        };
        if (useSliding) {
            options.SlidingExpiration = TimeSpan.FromMinutes(cacheTime);
        }
        else {
            options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheTime);
        }

        _ = options.AddExpirationToken(new CancellationChangeToken(s_resetCacheToken.Token))
               .RegisterPostEvictionCallback(PostEvictionCallback);
        return options;
    }

    private void PostEvictionCallback(object? key, object? value, EvictionReason reason, object? state) {
        if (reason != EvictionReason.Replaced && key != null) {
            _ = _cacheEntries.TryRemove(key.ToString()!, out _);
        }

        _logger.LogDebug("Cache item evicted. Key: {CacheKey}, Reason: {reason}", key, reason);
    }
}