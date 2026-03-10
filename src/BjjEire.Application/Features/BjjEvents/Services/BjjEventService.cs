using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
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
            CacheKey.BjjEventsById(id),
            async ct => await bjjEventRepository.GetByIdAsync(id),
            tags: [CacheKey.BjjEventsTag]);
    }

    public async Task InsertAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        var inserted = await bjjEventRepository.InsertAsync(bjjEvent);
        BjjEventLog.Inserted(logger, inserted.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }

    public async Task UpdateAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        var updated = await bjjEventRepository.UpdateAsync(bjjEvent);
        BjjEventLog.Updated(logger, updated.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }

    public async Task DeleteAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);
        _ = await bjjEventRepository.DeleteAsync(bjjEvent);
        BjjEventLog.Deleted(logger, bjjEvent.Id);
        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }
}
