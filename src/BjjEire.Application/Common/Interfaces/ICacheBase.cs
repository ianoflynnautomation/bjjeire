namespace BjjEire.Application.Common.Interfaces;

public interface ICacheBase
{
    public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire);
    public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime);
    public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire);
    public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime);
    public Task RemoveAsync(string key, bool publisher = true);
    public Task RemoveByPrefixAsync(string prefix, bool publisher = true);
    public Task ClearAsync(bool publisher = true);
}