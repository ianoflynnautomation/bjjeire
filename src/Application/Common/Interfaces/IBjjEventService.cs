

using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Common.Interfaces;

public interface IBjjEventService
{
    Task<BjjEvent> GetById(string id);
    Task<List<BjjEvent>> GetAll();
    Task Insert(BjjEvent gym);
    Task Update(BjjEvent gym);
    Task Delete(BjjEvent gym);
}