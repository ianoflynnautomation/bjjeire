using System.Diagnostics;

using BjjEire.Application.Features.Competitions.Services;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BjjEire.Infrastructure.Features.Competitions;

public sealed class CompetitionDeactivationService(
    IServiceScopeFactory scopeFactory,
    IOptions<CompetitionDeactivationOptions> options,
    TimeProvider timeProvider,
    ILogger<CompetitionDeactivationService> logger) : BackgroundService
{
    private readonly CompetitionDeactivationOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        CompetitionDeactivationServiceLog.ServiceStarted(logger, _options.Interval, _options.InitialDelay);

        try
        {
            await Task.Delay(_options.InitialDelay, timeProvider, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        using PeriodicTimer timer = new(_options.Interval, timeProvider);

        do
        {
            await RunSweepAsync(stoppingToken);
        }
        while (await WaitForNextTickAsync(timer, stoppingToken));

        CompetitionDeactivationServiceLog.ServiceStopping(logger);
    }

    private async Task RunSweepAsync(CancellationToken cancellationToken)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();

        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            ICompetitionDeactivator deactivator = scope.ServiceProvider.GetRequiredService<ICompetitionDeactivator>();

            long deactivatedCount = await deactivator.DeactivateExpiredAsync(cancellationToken);

            stopwatch.Stop();
            CompetitionDeactivationServiceLog.SweepCompleted(logger, deactivatedCount, stopwatch.ElapsedMilliseconds);
        }
#pragma warning disable CA1031 // BackgroundService must never bubble exceptions — host would crash
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            CompetitionDeactivationServiceLog.SweepFailed(logger, ex);
        }
#pragma warning restore CA1031
    }

    private static async Task<bool> WaitForNextTickAsync(PeriodicTimer timer, CancellationToken cancellationToken)
    {
        try
        {
            return await timer.WaitForNextTickAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
