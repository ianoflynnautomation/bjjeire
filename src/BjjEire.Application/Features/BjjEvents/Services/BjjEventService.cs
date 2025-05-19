
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;
using ZstdSharp.Unsafe;

namespace BjjEire.Application.Features.BjjEvents.Services;

public class BjjEventService(IRepository<BjjEvent> bjjEventRepository, ICacheBase cacheBase) : IBjjEventService
{
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly ICacheBase _cacheBase = cacheBase;

    public virtual Task<BjjEvent> GetById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        var key = CacheKey.BjjEventsById(id);
        return _cacheBase.GetAsync(key, () => _bjjEventRepository.GetByIdAsync(id));
    }


    // public virtual async Task<BjjEvent> GetAll(int page, int pageSize, string? county, BjjEventType? type) {

    //        var cacheKey = CacheKey.AllBjjEvents(page, pageSize, county, type);

    //     return await _cacheBase.GetAsync(cacheKey, async () => {
    //         var query = _bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

    //         if (!string.IsNullOrWhiteSpace(county)) {
    //             query = query.Where(x => x.County.Equals(county, StringComparison.CurrentCultureIgnoreCase));
    //         }

    //         if (type.HasValue) {
    //             query = query.Where(x => x.Type == type.Value);
    //         }

    //         query = query.OrderBy(x => x.CreatedOnUtc);

    //         return await Task.FromResult(query);
    //     });
    // }

    public virtual async Task Insert(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        _ = await _bjjEventRepository.InsertAsync(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BjjEventsByPatternKey());
    }

    public virtual async Task Update(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        _ = await _bjjEventRepository.UpdateAsync(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BjjEventsByPatternKey());
    }

    public virtual async Task Delete(BjjEvent bjjEvent)
    {
        ArgumentNullException.ThrowIfNull(bjjEvent);

        await _cacheBase.RemoveByPrefix(CacheKey.BjjEventsByPatternKey());

        _ = await _bjjEventRepository.DeleteAsync(bjjEvent);
    }
}