
namespace BjjEire.Infrastructure.Events;

public class EntityCacheEvent(string entity, CacheEvent @event) : INotification
{
    public string Entity { get; private set; } = entity;
    public CacheEvent Event { get; private set; } = @event;
}