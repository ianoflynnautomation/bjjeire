
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure;
using BjjEire.Infrastructure.Configuration;
using BjjEire.Infrastructure.Data.Mongo;

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

        _ = builder.Services.AddOptions<DatabaseOptions>().Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName)).ValidateOnStart();
        _ = builder.Services.AddOptions<JwtOptions>().Bind(builder.Configuration.GetSection(JwtOptions.SectionName)).ValidateOnStart();

        _ = builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<DatabaseOptions>>().Value);

        _ = builder.Services.AddSingleton<IAuditInfoProvider, AuditInfoProvider>();
        _ = builder.Services.AddHttpContextAccessor();

        var dbConfig = builder.Configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
                         ?? new DatabaseOptions { UseLiteDb = false };

        if (!dbConfig.UseLiteDb)
        {
            ConfigureMongoDb(builder.Services, builder.Configuration);
            _ = builder.Services.AddScoped<IDatabaseContext, MongoDBContext>();
            _ = builder.Services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));
        }
        _ = builder.Services.AddHybridCache(options =>
            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(5),
                LocalCacheExpiration = TimeSpan.FromMinutes(5)
            });

        return builder;
    }

    private static void ConfigureMongoDb(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(MongoDbConnectionStringName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException($"Connection string '{MongoDbConnectionStringName}' not found or is empty in ConnectionStrings.");
        }

        _ = services.AddSingleton<IMongoClient>(sp =>
        {
            var clientSettings = MongoClientSettings.FromConnectionString(connectionString);
            return new MongoClient(clientSettings);
        });

        _ = services.AddScoped<IMongoDatabase>(sp =>
        {
            var client = sp.GetRequiredService<IMongoClient>();
            var mongoUrl = MongoUrl.Create(connectionString);
            var databaseName = mongoUrl.DatabaseName;

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

            var conventionPack = new ConventionPack
            {
              new IgnoreExtraElementsConvention(true),
              new CamelCaseElementNameConvention(),
              new EnumRepresentationConvention(BsonType.String)
          };
            ConventionRegistry.Register("AppConventions", conventionPack, t => true);

            s_mongoDbConventionsRegistered = true;
        }
    }

}
