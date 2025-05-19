
using BjjEire.Domain.Entities;

namespace BjjEire.Infrastructure.Events;

public class EntityDeleted<T>(T entity) : INotification where T : ParentEntity
{
    public T Entity { get; private set; } = entity;
}