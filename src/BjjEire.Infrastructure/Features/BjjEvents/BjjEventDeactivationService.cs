using System.Diagnostics;

using BjjEire.Application.Features.BjjEvents.Services;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BjjEire.Infrastructure.Features.BjjEvents;

public sealed class BjjEventDeactivationService(
    IServiceScopeFactory scopeFactory,
    IOptions<BjjEventDeactivationOptions> options,
    TimeProvider timeProvider,
    ILogger<BjjEventDeactivationService> logger) : BackgroundService
{
    private readonly BjjEventDeactivationOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        BjjEventDeactivationServiceLog.ServiceStarted(logger, _options.Interval, _options.InitialDelay);

        try
        {
            await Task.Delay(_options.InitialDelay, timeProvider, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        using var timer = new PeriodicTimer(_options.Interval, timeProvider);

        do
        {
            await RunSweepAsync(stoppingToken);
        }
        while (await WaitForNextTickAsync(timer, stoppingToken));

        BjjEventDeactivationServiceLog.ServiceStopping(logger);
    }

    private async Task RunSweepAsync(CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var deactivator = scope.ServiceProvider.GetRequiredService<IBjjEventDeactivator>();

            var deactivatedCount = await deactivator.DeactivateExpiredAsync(cancellationToken);

            stopwatch.Stop();
            BjjEventDeactivationServiceLog.SweepCompleted(logger, deactivatedCount, stopwatch.ElapsedMilliseconds);
        }
#pragma warning disable CA1031 // BackgroundService must never bubble exceptions — host would crash
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            BjjEventDeactivationServiceLog.SweepFailed(logger, ex);
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
