

using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Common.Interfaces;

public interface IBjjEventService
{
    public Task<BjjEvent> GetByIdAsync(string id);
    public Task InsertAsync(BjjEvent bbjEvent);
    public Task UpdateAsync(BjjEvent bbjEvent);
    public Task DeleteAsync(BjjEvent bbjEvent);
}