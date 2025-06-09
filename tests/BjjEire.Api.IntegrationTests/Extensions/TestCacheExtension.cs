// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BjjEire.Api.IntegrationTests.Extensions;

public static class TestCacheExtension
{
    public static IServiceCollection AddTestCacheServices(this IServiceCollection services)
    {
        _ = services.AddSingleton<ICacheBase, NoOpCache>();

        return services;
    }

    public static IServiceCollection RemoveTestCacheServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);
        _ = services.RemoveAll<ICacheBase>();

        return services;
    }

    public class NoOpCache : ICacheBase
    {
        public Task ClearAsync(bool publisher = true) => Task.CompletedTask;

        public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire) => acquire();

        public Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) => acquire();

        public Task RemoveAsync(string key, bool publisher = true) => Task.CompletedTask;

        public Task RemoveByPrefixAsync(string prefix, bool publisher = true) => Task.CompletedTask;

        public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire) => acquire();

        public Task<T> SetAsync<T>(string key, Func<Task<T>> acquire, int cacheTime) => acquire();
    }
}
