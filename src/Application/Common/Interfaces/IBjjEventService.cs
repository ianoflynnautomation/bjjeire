

using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Common.Interfaces;

public interface IBjjEventService
{
    Task<BjjEvent> GetById(string id);
    Task<List<BjjEvent>> GetAll();
    Task Insert(BjjEvent bbjEvent);
    Task Update(BjjEvent bbjEvent);
    Task Delete(BjjEvent bbjEvent);
}