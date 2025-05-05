
using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.Services;

public class GymService(IRepository<Gym> openMatRepository, ICacheBase cacheBase) : IGymService
{
    private readonly IRepository<Gym> _openMatRepository = openMatRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<Gym> GetById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        var key = string.Format(CacheKey.GYMS_BY_ID_KEY, id);
        return _cacheBase.GetAsync(key, () => _openMatRepository.GetByIdAsync(id));
    }

    public virtual async Task<IList<Gym>> GetByCity(string city)
    {
        return await _openMatRepository.Table.Where(x => x.Address.City == city).ToListAsync();
    }

    public virtual async Task Insert(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _openMatRepository.InsertAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYMS_PATTERN_KEY);
    }

    public virtual async Task Update(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _openMatRepository.UpdateAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYMS_PATTERN_KEY);
    }

    public virtual async Task Delete(Gym gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.GYMS_PATTERN_KEY);

        await _openMatRepository.DeleteAsync(gym);
    }

}