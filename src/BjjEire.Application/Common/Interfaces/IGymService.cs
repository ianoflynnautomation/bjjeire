using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Common.Interfaces;

public interface IGymService
{
    public Task<Gym> GetByIdAsync(string id);
    public Task InsertAsync(Gym gym);
    public Task UpdateAsync(Gym gym);
    public Task DeleteAsync(Gym gym);
}
