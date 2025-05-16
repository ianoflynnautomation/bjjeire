using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Common.Interfaces;

public interface IGymService
{
    public Task<Gym> GetById(string id);
    public Task Insert(Gym gym);
    public Task Update(Gym gym);
    public Task Delete(Gym gym);
}