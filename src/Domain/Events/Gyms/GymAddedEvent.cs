
using BjjWorld.Domain.Entities.Gyms;
using MediatR;

namespace BjjWorld.Domain.Events.Gyms;

public class GymAddedEvent(Gym gym) : INotification
{
    public Gym Gym { get; private set; } = gym;
}