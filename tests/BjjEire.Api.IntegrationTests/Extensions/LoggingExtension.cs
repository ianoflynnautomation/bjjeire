// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BjjEire.Api.IntegrationTests.Extensions;

public class LoggingExtension
{
    // public static IServiceCollection ConfigureServices(IServiceCollection services)
    // {
    //     var loggerFactory = ConfigureGlobalLogger();
    //     services.AddSingleton(loggerFactory);
    //     services.AddSingleton(typeof(Microsoft.Extensions.Logging.ILogger<>), typeof(Logger<>));
    //     services.AddSingleton(sp => loggerFactory.CreateLogger("Default"));
    //
    //     return services;
    // }
}
