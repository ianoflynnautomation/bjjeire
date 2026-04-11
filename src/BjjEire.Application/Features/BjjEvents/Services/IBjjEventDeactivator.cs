namespace BjjEire.Application.Features.BjjEvents.Services;

public interface IBjjEventDeactivator
{
    Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken);
}
