
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Infrastructure;
using BjjEire.Infrastructure.Data.Mongo;
using BjjEire.Infrastructure.Features.BjjEvents;
using BjjEire.Infrastructure.Features.Common;
using BjjEire.Infrastructure.Features.Competitions;

using Microsoft.Extensions.Caching.Hybrid;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection
{
    private const string MongoDbConnectionStringName = "Mongodb";

    private static bool s_mongoDbConventionsRegistered;
    private static readonly Lock MongoDbRegistrationLock = new();

    public static IHostApplicationBuilder AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddSingleton<IAuditInfoProvider, AuditInfoProvider>();
        _ = builder.Services.AddHttpContextAccessor();
        _ = builder.Services.AddSingleton(TimeProvider.System);

        ConfigureMongoDb(builder.Services, builder.Configuration);
        _ = builder.Services.AddScoped<IDatabaseContext, MongoDBContext>();
        _ = builder.Services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

        _ = builder.Services.AddHybridCache(options =>
            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(5),
                LocalCacheExpiration = TimeSpan.FromMinutes(5)
            });

        AddPeriodicDeactivation<Competition, CompetitionDeactivator>(
            builder, CompetitionDeactivator.ConfigSectionName);

        AddPeriodicDeactivation<BjjEvent, BjjEventDeactivator>(
            builder, BjjEventDeactivator.ConfigSectionName);

        return builder;
    }

    private static void AddPeriodicDeactivation<TEntity, TDeactivator>(
        IHostApplicationBuilder builder,
        string configSectionName)
        where TEntity : BjjEire.Domain.Entities.BaseEntity
        where TDeactivator : class, IDeactivator<TEntity>
    {
        _ = builder.Services
            .AddOptions<DeactivationOptions<TEntity>>()
            .Bind(builder.Configuration.GetSection(configSectionName))
            .ValidateOnStart();
        _ = builder.Services.AddScoped<IDeactivator<TEntity>, TDeactivator>();
        _ = builder.Services.AddHostedService<PeriodicDeactivationService<TEntity>>();
    }

    private static void ConfigureMongoDb(IServiceCollection services, IConfiguration configuration)
    {
        string? connectionString = configuration.GetConnectionString(MongoDbConnectionStringName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException($"Connection string '{MongoDbConnectionStringName}' not found or is empty in ConnectionStrings.");
        }

        _ = services.AddSingleton<IMongoClient>(_ =>
        {
            MongoClientSettings clientSettings = MongoClientSettings.FromConnectionString(connectionString);
            clientSettings.ServerApi = new ServerApi(ServerApiVersion.V1);
            clientSettings.MaxConnectionPoolSize = 100;
            return new MongoClient(clientSettings);
        });

        _ = services.AddSingleton<IMongoDatabase>(sp =>
        {
            IMongoClient client = sp.GetRequiredService<IMongoClient>();
            MongoUrl mongoUrl = MongoUrl.Create(connectionString);
            string databaseName = mongoUrl.DatabaseName;

            return string.IsNullOrWhiteSpace(databaseName)
                    ? throw new InvalidOperationException($"MongoDB database name could not be determined from connection string '{MongoDbConnectionStringName}'.")
                    : client.GetDatabase(databaseName);
        });

        RegisterMongoDbSerializationConventions();
    }

    private static void RegisterMongoDbSerializationConventions()
    {
        lock (MongoDbRegistrationLock) // Ensures thread-safety
        {
            if (s_mongoDbConventionsRegistered)
            {
                // Conventions and serializers have already been registered, so skip.
                return;
            }

            BsonSerializer.RegisterSerializer(
                new DictionaryInterfaceImplementerSerializer<Dictionary<int, int>>(
                    DictionaryRepresentation.ArrayOfArrays
                )
            );

            ConventionPack conventionPack =
            [
              new IgnoreExtraElementsConvention(true),
              new CamelCaseElementNameConvention(),
              new EnumRepresentationConvention(BsonType.String)
          ];
            ConventionRegistry.Register("AppConventions", conventionPack, t => true);

            s_mongoDbConventionsRegistered = true;
        }
    }
}
