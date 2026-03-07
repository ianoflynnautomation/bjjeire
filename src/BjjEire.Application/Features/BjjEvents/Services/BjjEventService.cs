using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.SharedKernel.Logging;

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

        logger.LogInformation(ApplicationLogEvents.BjjEventService.GetByIdAttempt,
            "Attempting to get BjjEvent by ID {BjjEventId}", id);

        return await hybridCache.GetOrCreateAsync(
            CacheKey.BjjEventsById(id),
            async ct => await bjjEventRepository.GetByIdAsync(id),
            tags: [CacheKey.BjjEventsTag]);
    }

    public async Task InsertAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.InsertAttempt,
            "Attempting to insert BjjEvent. EventName: {BjjEventName}", bjjEvent.Name);

        var insertedEvent = await bjjEventRepository.InsertAsync(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.InsertSuccess,
            "Successfully inserted BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
            insertedEvent.Id, insertedEvent.Name);

        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }

    public async Task UpdateAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.UpdateAttempt,
            "Attempting to update BjjEvent with ID {BjjEventId}", bjjEvent.Id);

        var updatedBjjEvent = await bjjEventRepository.UpdateAsync(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.UpdateSuccess,
            "Successfully updated BjjEvent with ID {BjjEventId}", updatedBjjEvent.Id);

        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }

    public async Task DeleteAsync(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.DeleteAttempt,
            "Attempting to delete BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
            bjjEvent.Id, bjjEvent.Name);

        _ = await bjjEventRepository.DeleteAsync(bjjEvent);

        logger.LogInformation(ApplicationLogEvents.BjjEventService.DeleteSuccess,
            "Successfully deleted BjjEvent with ID {BjjEventId}", bjjEvent.Id);

        await hybridCache.RemoveByTagAsync(CacheKey.BjjEventsTag);
    }
}
