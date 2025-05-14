using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Common.Interfaces;

public interface IGymService
{
    public Task<Gym> GetById(string id);
    public Task<List<Gym>> GetAll();
    public Task Insert(Gym gym);
    public Task Update(Gym gym);
    public Task Delete(Gym gym);
}