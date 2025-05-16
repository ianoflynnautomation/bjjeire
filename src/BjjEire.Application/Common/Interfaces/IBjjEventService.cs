

using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Common.Interfaces;

public interface IBjjEventService
{
    public Task<BjjEvent> GetById(string id);
    public Task Insert(BjjEvent bbjEvent);
    public Task Update(BjjEvent bbjEvent);
    public Task Delete(BjjEvent bbjEvent);
}