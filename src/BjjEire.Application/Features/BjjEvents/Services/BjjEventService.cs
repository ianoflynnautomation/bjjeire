using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Caching;
using BjjEire.Domain.Entities.BjjEvents;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Services;

public sealed class BjjEventService(
    IRepository<BjjEvent> bjjEventRepository,
    HybridCache hybridCache,
    ILogger<BjjEventService> logger) : IBjjEventService
{
    public async Task<BjjEvent> GetByIdAsync(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        BjjEventLog.GettingById(logger, id);
        return await hybridCache.GetOrCreateAsync(
            BjjEventCacheKeys.ById(id),
            async ct => await bjjEventRepository.GetByIdAsync(id),
            tags: [BjjEventCacheKeys.Tag]);
    }

    public async Task InsertAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        var inserted = await bjjEventRepository.InsertAsync(bjjEvent);
        BjjEventLog.Inserted(logger, inserted.Id);
        await hybridCache.RemoveByTagAsync(BjjEventCacheKeys.Tag);
    }

    public async Task UpdateAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        var updated = await bjjEventRepository.UpdateAsync(bjjEvent);
        BjjEventLog.Updated(logger, updated.Id);
        await hybridCache.RemoveByTagAsync(BjjEventCacheKeys.Tag);
    }

    public async Task DeleteAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        _ = await bjjEventRepository.DeleteAsync(bjjEvent);
        BjjEventLog.Deleted(logger, bjjEvent.Id);
        await hybridCache.RemoveByTagAsync(BjjEventCacheKeys.Tag);
    }
}
