

using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Common.Interfaces;

public interface IBjjEventService
{
    public Task<BjjEvent> GetById(string id);
    public Task<List<BjjEvent>> GetAll();
    public Task Insert(BjjEvent bbjEvent);
    public Task Update(BjjEvent bbjEvent);
    public Task Delete(BjjEvent bbjEvent);
}