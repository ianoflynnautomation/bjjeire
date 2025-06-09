// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Formatting.Compact;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.Extensions;

public static class LoggingExtension {
    public static IWebHostBuilder ConfigureCustomLogging(this IWebHostBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.ConfigureLogging((context, loggingBuilder) => {
            _ = loggingBuilder.ClearProviders();

            var loggerConfiguration = new LoggerConfiguration()
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .Enrich.WithThreadId()
                .Enrich.WithProperty("Environment", "IntegrationTests")
                .WriteTo.Console(new CompactJsonFormatter());

            // Allow the test to customize the logger configuration
            // ConfigureLogger(loggerConfiguration);

            var logger = loggerConfiguration.CreateLogger();
            _ = loggingBuilder.AddSerilog(logger, dispose: true);
        });

        return builder;
    }
    // public static IWebHostBuilder ConfigureCustomTestLogging(this IWebHostBuilder builder, ITestOutputHelper outputHelper)
    // {
    //     ArgumentNullException.ThrowIfNull(builder);
    //     ArgumentNullException.ThrowIfNull(outputHelper);
    //
    //     _ = builder.ConfigureLogging((context, loggingBuilder) =>
    //     {
    //         _ = loggingBuilder.ClearProviders();
    //
    //         var loggerConfiguration = new LoggerConfiguration()
    //             .MinimumLevel.Information()
    //             .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    //             .Enrich.FromLogContext()
    //             .Enrich.WithProperty("Environment", "IntegrationTests")
    //             .WriteTo.Console(new CompactJsonFormatter())
    //             .WriteTo.TestOutput(outputHelper, LogEventLevel.Information);
    //
    //         var logger = loggerConfiguration.CreateLogger();
    //         _ = loggingBuilder.AddSerilog(logger, dispose: true);
    //     });
    //
    //     return builder;
    // }

    public static Microsoft.Extensions.Logging.ILogger ConfigureTestLogger(ITestOutputHelper output) {
        var serilogLogger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .Enrich.WithThreadId()
            .Enrich.WithProperty("Environment", "IntegrationTests")
            .WriteTo.TestOutput(output, outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{EventId.Name}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.Console(new CompactJsonFormatter())
            .CreateLogger();

        var loggerFactory = new LoggerFactory().AddSerilog(serilogLogger);
        return loggerFactory.CreateLogger("TestLogger");
    }
}
