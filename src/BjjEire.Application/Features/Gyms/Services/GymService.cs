using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.Services;

public class GymService(IRepository<Gym> gymRepository, ICacheBase cacheBase) : IGymService
{
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<Gym> GetByIdAsync(string id)
    {
        ArgumentNullException.ThrowIfNull(id);

        string key = CacheKey.GymById(id);
        return _cacheBase.GetAsync(key, () => _gymRepository.GetByIdAsync(id));
    }

    public virtual async Task InsertAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        _ = await _gymRepository.InsertAsync(gym);

        await _cacheBase.RemoveByPrefixAsync(CacheKey.GymByPatternKey());
    }

    public virtual async Task UpdateAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        _ = await _gymRepository.UpdateAsync(gym);

        await _cacheBase.RemoveByPrefixAsync(CacheKey.GymByPatternKey());
    }

    public virtual async Task DeleteAsync(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _cacheBase.RemoveByPrefixAsync(CacheKey.GymByPatternKey());

        _ = await _gymRepository.DeleteAsync(gym);
    }
}