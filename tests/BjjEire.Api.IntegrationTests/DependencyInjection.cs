// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Interfaces;
using BjjEire.Api.IntegrationTests.Services;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure.Data.Mongo;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using MongoDB.Driver;

namespace BjjEire.Api.IntegrationTests;

public static class DependencyInjection
{
    public static IServiceCollection AddApiTestServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        _ = services.AddScoped<ITestDatabaseService, TestDatabaseService>();
        _ = services.AddScoped<ITestAuthService, TestAuthService>();
        _ = services.AddScoped<ITestAssertionService, TestAssertionService>();

        return services;
    }

    public static IServiceCollection AddTestDatabaseServices(this IServiceCollection services,string databaseName, string connectionString)
    {
        ArgumentNullException.ThrowIfNull(services);

        _ = services.AddSingleton<IMongoClient>(_ => new MongoClient(connectionString));
        _ = services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));
        _ = services.AddScoped<IDatabaseContext, MongoDBContext>();
        _ = services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

        return services;
    }

    public static IServiceCollection RemoveTestServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        _ = services.RemoveAll<IMongoClient>();
        _ = services.RemoveAll<IMongoDatabase>();
        _ = services.RemoveAll<IDatabaseContext>();
        _ = services.RemoveAll(typeof(IRepository<>));
        _ = services.RemoveAll<IHostedService>();

        return services;
    }
}
