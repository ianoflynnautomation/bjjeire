using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.SharedKernel.Logging;

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

        logger.LogInformation(ApplicationLogEvents.GymService.GetByIdAttempt,
            "Attempting to get Gym by ID {GymId}", id);

        return await hybridCache.GetOrCreateAsync(
            CacheKey.GymById(id),
            async ct => await gymRepository.GetByIdAsync(id),
            tags: [CacheKey.GymsTag]);
    }

    public virtual async Task InsertAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.InsertAttempt,
            "Attempting to insert Gym. GymName: {GymName}", gym.Name);

        var insertedGym = await gymRepository.InsertAsync(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.InsertSuccess,
            "Successfully inserted Gym with ID {GymId}. GymName: {GymName}", insertedGym.Id, insertedGym.Name);

        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }

    public virtual async Task UpdateAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.UpdateAttempt,
            "Attempting to update Gym with ID {GymId}. GymName: {GymName}", gym.Id, gym.Name);

        var updatedGym = await gymRepository.UpdateAsync(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.UpdateSuccess,
            "Successfully updated Gym with ID {GymId}. GymName: {GymName}", updatedGym.Id, updatedGym.Name);

        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }

    public virtual async Task DeleteAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.DeleteAttempt,
            "Attempting to delete Gym with ID {GymId}. GymName: {GymName}", gym.Id, gym.Name);

        _ = await gymRepository.DeleteAsync(gym);

        logger.LogInformation(ApplicationLogEvents.GymService.DeleteSuccess,
            "Successfully deleted Gym with ID {GymId}", gym.Id);

        await hybridCache.RemoveByTagAsync(CacheKey.GymsTag);
    }
}
