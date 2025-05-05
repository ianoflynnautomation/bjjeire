
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Common.Interfaces;

public interface IGymService
{
    Task<IList<Gym>> GetByCity(string city);
    //Task<IPagedList<Gym>> GetByCityPaginated(string city, int pageIndex, int pageSize);
    Task<Gym> GetById(string id);
    Task Insert(Gym gym);
    Task Update(Gym gym);
    Task Delete(Gym gym);
}