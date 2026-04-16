// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

using Serilog;
using Serilog.Core;
using Serilog.Formatting.Compact;

using Xunit.Abstractions;

namespace BjjEire.Core.Extensions;

public static class LoggingExtension
{
    private static readonly object SyncRoot = new();
    private static readonly List<ILoggerFactory> LoggerFactories = [];

    static LoggingExtension()
    {
        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            lock (SyncRoot)
            {
                foreach (ILoggerFactory factory in LoggerFactories)
                {
                    factory.Dispose();
                }

                LoggerFactories.Clear();
            }
        };
    }

    public static IWebHostBuilder ConfigureCustomLogging(this IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.ConfigureLogging((_, loggingBuilder) =>
        {
            loggingBuilder.ClearProviders();

            Logger logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .Enrich.WithThreadId()
                .Enrich.WithProperty("Environment", "IntegrationTests")
                .WriteTo.Console(new CompactJsonFormatter())
                .CreateLogger();

            loggingBuilder.AddSerilog(logger, dispose: true);
        });

        return builder;
    }

    public static Microsoft.Extensions.Logging.ILogger ConfigureTestLogger(ITestOutputHelper output)
    {
        Logger serilogLogger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("Environment", "IntegrationTests")
            .WriteTo.TestOutput(output, outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{EventId.Name}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.Console(new CompactJsonFormatter())
            .CreateLogger();

        // Lifetime is managed centrally in this static helper and disposed on ProcessExit.
#pragma warning disable CA2000
        ILoggerFactory loggerFactory = new LoggerFactory().AddSerilog(serilogLogger);
#pragma warning restore CA2000
        lock (SyncRoot)
        {
            LoggerFactories.Add(loggerFactory);
        }

        return loggerFactory.CreateLogger("TestLogger");
    }
}
