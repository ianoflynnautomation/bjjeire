// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;
using BjjEire.SharedKernel.Logging;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Services;

public sealed class BjjEventService(
    IRepository<BjjEvent> bjjEventRepository,
    ICacheBase cacheBase,
    ILogger<BjjEventService> logger) : IBjjEventService
{
  private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
  private readonly ICacheBase _cacheBase = cacheBase;
  private readonly ILogger<BjjEventService> _logger = logger;

  public async Task<BjjEvent> GetByIdAsync(string id)
  {
    ArgumentNullException.ThrowIfNull(id);
    var key = CacheKey.BjjEventsById(id);

    _logger.LogInformation(ApplicationLogEvents.BjjEventService.GetByIdAttempt, "Attempting to get BjjEvent by ID {BjjEventId} using cache key {CacheKey}", id, key);

    var bjjEvent = await _cacheBase.GetAsync(key, () =>
    {
      _logger.LogInformation("Cache miss for BjjEvent ID {BjjEventId}. Fetching from repository.", id);
      return _bjjEventRepository.GetByIdAsync(id);
    });

    return bjjEvent;
  }

  public async Task InsertAsync(BjjEvent bjjEvent)
  {
    ArgumentNullException.ThrowIfNull(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.InsertAttempt,
        "Attempting to insert BjjEvent. EventName: {BjjEventName}",
        bjjEvent.Name);

    var insertedEvent = await _bjjEventRepository.InsertAsync(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.InsertSuccess,
        "Successfully inserted BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
        insertedEvent.Id,
        insertedEvent.Name);

    _logger.LogInformation(
        ApplicationLogEvents.Cache.InvalidationInitiated,
        "Initiating cache invalidation for BjjEvents pattern {CachePatternKey} due to insertion of BjjEvent ID {BjjEventId}",
        CacheKey.BjjEventsByPatternKey(),
        insertedEvent.Id);
    await _cacheBase.RemoveByPrefixAsync(CacheKey.BjjEventsByPatternKey());
  }

  public async Task UpdateAsync(BjjEvent bjjEvent)
  {
    ArgumentNullException.ThrowIfNull(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.UpdateAttempt,
        "Attempting to update BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
        bjjEvent.Id,
        bjjEvent.Name);

    var updatedEvent = await _bjjEventRepository.UpdateAsync(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.UpdateSuccess,
        "Successfully updated BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
        updatedEvent.Id,
        updatedEvent.Name);

    _logger.LogInformation(
        ApplicationLogEvents.Cache.InvalidationInitiated,
        "Initiating cache invalidation for BjjEvents pattern {CachePatternKey} due to update of BjjEvent ID {BjjEventId}",
        CacheKey.BjjEventsByPatternKey(),
        updatedEvent.Id);
    await _cacheBase.RemoveByPrefixAsync(CacheKey.BjjEventsByPatternKey());
  }

  public async Task DeleteAsync(BjjEvent bjjEvent)
  {
    ArgumentNullException.ThrowIfNull(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.DeleteAttempt,
        "Attempting to delete BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
        bjjEvent.Id,
        bjjEvent.Name);

    await _cacheBase.RemoveByPrefixAsync(CacheKey.BjjEventsByPatternKey());
    _logger.LogInformation(
        ApplicationLogEvents.Cache.InvalidationInitiated,
        "Cache invalidation for BjjEvents pattern {CachePatternKey} initiated prior to deleting BjjEvent ID {BjjEventId}",
        CacheKey.BjjEventsByPatternKey(),
        bjjEvent.Id);

    var deletedEvent = await _bjjEventRepository.DeleteAsync(bjjEvent);

    _logger.LogInformation(
        ApplicationLogEvents.BjjEventService.DeleteSuccess,
        "Successfully deleted BjjEvent with ID {BjjEventId}. EventName: {BjjEventName}",
        deletedEvent.Id,
        deletedEvent.Name);
  }
}
