namespace BjjEire.Application.Features.Competitions.Services;

public interface ICompetitionDeactivator
{
    Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken);
}
