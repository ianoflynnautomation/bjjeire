

using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Common.Interfaces;

public interface IBjjEventService {
    public Task<BjjEvent> GetByIdAsync(string id);
    public Task InsertAsync(BjjEvent bjjEvent);
    public Task UpdateAsync(BjjEvent bjjEvent);
    public Task DeleteAsync(BjjEvent bjjEvent);
}
