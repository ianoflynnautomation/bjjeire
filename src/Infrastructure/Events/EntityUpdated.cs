
using BjjWorld.Domain.Entities;

namespace BjjWorld.Infrastructure.Events;

public class EntityUpdated<T>(T entity) : INotification where T : ParentEntity
{
    public T Entity { get; private set; } = entity;
}