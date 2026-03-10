using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.Gyms;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Services;

public class GymService(
    IRepository<Gym> gymRepository,
    HybridCache hybridCache,
    ILogger<GymService> logger) : IGymService
{
    public virtual async Task<Gym> GetByIdAsync(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        GymLog.GettingById(logger, id);
        return await hybridCache.GetOrCreateAsync(
            CacheKey.GymById(id),
            async ct => await gymRepository.GetByIdAsync(id),
            tags: [CacheKey.GymsTag]);
    }

    public virtual async Task InsertAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        var inserted = await gymRepository.InsertAsync(gym);
        GymLog.Inserted(logger, inserted.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }

    public virtual async Task UpdateAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        var updated = await gymRepository.UpdateAsync(gym);
        GymLog.Updated(logger, updated.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }

    public virtual async Task DeleteAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        _ = await gymRepository.DeleteAsync(gym);
        GymLog.Deleted(logger, gym.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }
}
