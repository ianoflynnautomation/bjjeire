using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.Gyms.Services;

public class GymService(IRepository<Gym> gymRepository, ICacheBase cacheBase) : IGymService
{
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<Gym> GetById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        var key = string.Format(CacheKey.GYM_BY_ID_KEY, id);
        return _cacheBase.GetAsync(key, () => _gymRepository.GetByIdAsync(id));
    }

    public Task<List<Gym>> GetAll()
    {
        throw new NotImplementedException();
    }

    public virtual async Task Insert(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _gymRepository.InsertAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY);
    }

    public virtual async Task Update(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _gymRepository.UpdateAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY);
    }

    public virtual async Task Delete(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY);

        await _gymRepository.DeleteAsync(gym);
    }
}