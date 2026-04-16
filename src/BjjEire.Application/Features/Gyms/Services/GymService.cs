using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.Caching;
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
            GymCacheKeys.ById(id),
            async ct => await gymRepository.GetByIdAsync(id),
            tags: [GymCacheKeys.Tag]);
    }

    public virtual async Task InsertAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        Gym inserted = await gymRepository.InsertAsync(gym);
        GymLog.Inserted(logger, inserted.Id);
        await hybridCache.RemoveByTagAsync(GymCacheKeys.Tag);
    }

    public virtual async Task UpdateAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        Gym updated = await gymRepository.UpdateAsync(gym);
        GymLog.Updated(logger, updated.Id);
        await hybridCache.RemoveByTagAsync(GymCacheKeys.Tag);
    }

    public virtual async Task DeleteAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);
        _ = await gymRepository.DeleteAsync(gym);
        GymLog.Deleted(logger, gym.Id);
        await hybridCache.RemoveByTagAsync(GymCacheKeys.Tag);
    }
}
