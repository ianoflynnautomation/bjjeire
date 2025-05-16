using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Gyms.Services;

public class GymService(IRepository<Gym> gymRepository, ICacheBase cacheBase) : IGymService {
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<Gym> GetById(string id) {
        ArgumentNullException.ThrowIfNull(id);

        string key = CacheKey.GymById(id);
        return _cacheBase.GetAsync(key, () => _gymRepository.GetByIdAsync(id));
    }

    public virtual async Task Insert(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        _ = await _gymRepository.InsertAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GymByPatternKey());
    }

    public virtual async Task Update(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        _ = await _gymRepository.UpdateAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GymByPatternKey());
    }

    public virtual async Task Delete(Gym gym) {
        ArgumentNullException.ThrowIfNull(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GymByPatternKey());

        _ = await _gymRepository.DeleteAsync(gym);
    }
}