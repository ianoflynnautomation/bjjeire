// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Formatting.Compact;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.Common;

public static class SerilogConfiguration
{
    public static ILoggerFactory ConfigureGlobalLogger()
    {
        var serilogLogger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("Environment", "IntegrationTests")
            .WriteTo.Console(new CompactJsonFormatter())
            .CreateLogger();

        return new LoggerFactory().AddSerilog(serilogLogger);
    }

    public static Microsoft.Extensions.Logging.ILogger ConfigureTestLogger(ITestOutputHelper output)
    {
        var serilogLogger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("Environment", "IntegrationTests")
            .WriteTo.TestOutput(output,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{EventId.Name}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.Console(new CompactJsonFormatter())
            .CreateLogger();

        var loggerFactory = new LoggerFactory().AddSerilog(serilogLogger);
        return loggerFactory.CreateLogger("TestLogger");
    }

    public static void ConfigureServices(IServiceCollection services)
    {
        var loggerFactory = ConfigureGlobalLogger();
        services.AddSingleton(loggerFactory);
        services.AddSingleton(typeof(Microsoft.Extensions.Logging.ILogger<>), typeof(Logger<>));
        services.AddSingleton(sp => loggerFactory.CreateLogger("Default"));
    }
}

