using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common.Services;

public interface IDeactivator<TEntity> where TEntity : BaseEntity
{
    Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken);
}
