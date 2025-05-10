using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Common.Interfaces;

public interface IGymService
{
    Task<Gym> GetById(string id);
    Task<List<Gym>> GetAll();
    Task Insert(Gym gym);
    Task Update(Gym gym);
    Task Delete(Gym gym);
}