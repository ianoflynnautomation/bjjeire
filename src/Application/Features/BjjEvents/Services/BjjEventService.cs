
using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.Services;

public class BjjEventService(IRepository<BjjEvent> openMatRepository, ICacheBase cacheBase) : IBjjEventService
{
    private readonly IRepository<BjjEvent> _openMatRepository = openMatRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<BjjEvent> GetById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        var key = string.Format(CacheKey.BJJ_EVENT_BY_ID_KEY, id);
        return _cacheBase.GetAsync(key, () => _openMatRepository.GetByIdAsync(id));
    }

    public Task<List<BjjEvent>> GetAll()
    {
        throw new NotImplementedException();
    }

    public virtual async Task Insert(BjjEvent gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _openMatRepository.InsertAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);
    }

    public virtual async Task Update(BjjEvent gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _openMatRepository.UpdateAsync(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);
    }

    public virtual async Task Delete(BjjEvent gym)
    {
        ArgumentNullException.ThrowIfNull(gym);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);

        await _openMatRepository.DeleteAsync(gym);
    }
}