using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.SharedKernel.Logging;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Services;

public class GymService(
    IRepository<Gym> gymRepository,
    ICacheBase cacheBase,
    ILogger<GymService> logger) : IGymService {
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly ILogger<GymService> _logger = logger;

    public virtual async Task<Gym> GetByIdAsync(string id) {
        ArgumentNullException.ThrowIfNull(id);
        var key = CacheKey.GymById(id);

        _logger.LogInformation(ApplicationLogEvents.GymService.GetByIdAttempt, "Attempting to get Gym by ID {GymId} using cache key {CacheKey}", id, key);

        var gym = await _cacheBase.GetAsync(key, async () => {
            _logger.LogInformation(ApplicationLogEvents.GymService.GetByIdCacheMissRepoLookup, "Cache miss for Gym ID {GymId} (cache key {CacheKey}). Fetching from repository.", id, key);
            return await _gymRepository.GetByIdAsync(id);
        });

        return gym;
    }

    public virtual async Task InsertAsync(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        _logger.LogInformation(ApplicationLogEvents.GymService.InsertAttempt, "Attempting to insert Gym. GymName: {GymName}",
            gym.Name);

        var insertedGym = await _gymRepository.InsertAsync(gym);

        _logger.LogInformation(ApplicationLogEvents.GymService.InsertSuccess, "Successfully inserted Gym with ID {GymId}. GymName: {GymName}",
            insertedGym.Id,
            insertedGym.Name);

        _logger.LogInformation(ApplicationLogEvents.Cache.InvalidationInitiated, "Initiating cache invalidation for Gyms pattern {GymCachePatternKey} due to insertion of Gym ID {GymId}",
            CacheKey.GymByPatternKey(),
            insertedGym.Id);
        await _cacheBase.RemoveByPrefixAsync(CacheKey.GymByPatternKey());
    }

    public virtual async Task UpdateAsync(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        _logger.LogInformation(
            ApplicationLogEvents.GymService.UpdateAttempt,
            "Attempting to update Gym with ID {GymId}. GymName: {GymName}",
            gym.Id,
            gym.Name);

        var updatedGym = await _gymRepository.UpdateAsync(gym);

        _logger.LogInformation(ApplicationLogEvents.GymService.UpdateSuccess, "Successfully updated Gym with ID {GymId}. GymName: {GymName}",
            updatedGym.Id,
            updatedGym.Name);

        var specificCacheKey = CacheKey.BjjEventsById(gym.Id);
        var patternCacheKey = CacheKey.BjjEventsByPatternKey();

        _logger.LogInformation(ApplicationLogEvents.Cache.InvalidationInitiated, "Initiating cache invalidation for Gyms pattern {GymCachePatternKey} due to update of Gym ID {GymId}",
            CacheKey.GymByPatternKey(),
            updatedGym.Id);

        var removeSpecificTask = _cacheBase.RemoveAsync(specificCacheKey);
        var removePatternTask = _cacheBase.RemoveByPrefixAsync(patternCacheKey);

        await Task.WhenAll(removeSpecificTask, removePatternTask);
    }

    public virtual async Task DeleteAsync(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        _logger.LogInformation(
          ApplicationLogEvents.GymService.DeleteAttempt,
          "Attempting to delete Gym with ID {GymId}. GymName: {GymName}",
            gym.Id,
            gym.Name);

        _ = await _gymRepository.DeleteAsync(gym);

        _logger.LogInformation(ApplicationLogEvents.GymService.DeleteSuccess,
          "Successfully deleted Gym with ID {GymId}",
          gym.Id);

        var specificCacheKey = CacheKey.GymById(gym.Id);
        var patternCacheKey = CacheKey.GymByPatternKey();


        _logger.LogInformation(
          ApplicationLogEvents.Cache.InvalidationInitiated,
          "Initiating cache invalidation for Gyms pattern {GymCachePatternKey} prior to deleting Gym ID {GymId}",
            CacheKey.GymByPatternKey(),
            gym.Id);

        var removeSpecificTask = _cacheBase.RemoveAsync(specificCacheKey);
        var removePatternTask = _cacheBase.RemoveByPrefixAsync(patternCacheKey);


        await Task.WhenAll(removeSpecificTask, removePatternTask);

    }
}
