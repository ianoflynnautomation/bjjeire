// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;

using BjjEire.Application.Common.Services;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BjjEire.Infrastructure.Features.Common;

public sealed class PeriodicDeactivationService<TEntity>(
    IServiceScopeFactory scopeFactory,
    IOptions<DeactivationOptions<TEntity>> options,
    TimeProvider timeProvider,
    ILogger<PeriodicDeactivationService<TEntity>> logger)
    : BackgroundService
    where TEntity : BaseEntity
{
    private readonly DeactivationOptions<TEntity> _options = options.Value;
    private static readonly string EntityName = typeof(TEntity).Name;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        PeriodicDeactivationServiceLog.ServiceStarted(logger, EntityName, _options.Interval, _options.InitialDelay);

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

        PeriodicDeactivationServiceLog.ServiceStopping(logger, EntityName);
    }

    private async Task RunSweepAsync(CancellationToken cancellationToken)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();

        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            IDeactivator<TEntity> deactivator = scope.ServiceProvider.GetRequiredService<IDeactivator<TEntity>>();

            long deactivatedCount = await deactivator.DeactivateExpiredAsync(cancellationToken);

            stopwatch.Stop();
            PeriodicDeactivationServiceLog.SweepCompleted(logger, EntityName, deactivatedCount, stopwatch.ElapsedMilliseconds);
        }
#pragma warning disable CA1031 // BackgroundService must never bubble exceptions — host would crash
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            PeriodicDeactivationServiceLog.SweepFailed(logger, EntityName, ex);
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
