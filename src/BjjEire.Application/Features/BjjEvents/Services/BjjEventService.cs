
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Services;

public class BjjEventService(IRepository<BjjEvent> bjjEventRepository, ICacheBase cacheBase) : IBjjEventService {
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<BjjEvent> GetById(string id) {
        ArgumentNullException.ThrowIfNull(id);
        var key = string.Format(CacheKey.BJJ_EVENT_BY_ID_KEY, id);
        return _cacheBase.GetAsync(key, () => _bjjEventRepository.GetByIdAsync(id));
    }

    public Task<List<BjjEvent>> GetAll() => throw new NotImplementedException();

    public virtual async Task Insert(BjjEvent bjjEvent) {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        _ = await _bjjEventRepository.InsertAsync(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);
    }

    public virtual async Task Update(BjjEvent bjjEvent) {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        _ = await _bjjEventRepository.UpdateAsync(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);
    }

    public virtual async Task Delete(BjjEvent bjjEvent) {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BJJ_EVENT_PATTERN_KEY);

        _ = await _bjjEventRepository.DeleteAsync(bjjEvent);
    }
}