
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Infrastructure;
using BjjWorld.Infrastructure.Configuration;
using BjjWorld.Infrastructure.Data.Mongo;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Bson.Serialization.Options;
using MongoDB.Bson.Serialization.Serializers;
using Microsoft.Extensions.Options;
using BjjWorld.Infrastructure.Caching;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    private const string MongoDbConnectionStringName = "Mongodb";

    public static IHostApplicationBuilder AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddOptions<DatabaseOptions>().Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName)).ValidateOnStart();
        builder.Services.AddOptions<BackendAPIOptions>().Bind(builder.Configuration.GetSection(BackendAPIOptions.SectionName)).ValidateOnStart();
        builder.Services.AddOptions<CacheOptions>().Bind(builder.Configuration.GetSection(CacheOptions.SectionName)).ValidateOnStart();

        builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<DatabaseOptions>>().Value);

        builder.Services.AddSingleton<IAuditInfoProvider, AuditInfoProvider>();
        builder.Services.AddHttpContextAccessor();

        var dbConfig = builder.Configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
                         ?? new DatabaseOptions { UseLiteDb = false };

        if (!dbConfig.UseLiteDb)
        {
            ConfigureMongoDb(builder.Services, builder.Configuration);
            builder.Services.AddScoped<IDatabaseContext, MongoDBContext>();
            builder.Services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));
        }
        else
        {
            // Configure LiteDB services (Example - implement ConfigureLiteDb similarly)
            // ConfigureLiteDb(builder.Services, builder.Configuration);

            // Register LiteDB specific implementations
            // builder.Services.AddScoped<IDatabaseContext, LiteDbContext>();
            // builder.Services.AddScoped(typeof(IRepository<>), typeof(LiteDbRepository<>));
            // throw new NotImplementedException("LiteDB configuration is not yet implemented.");
        }

        builder.Services.AddMemoryCache(options =>
        {
            options.SizeLimit = 1024; // Optional: Limit cache to 1024 entries
        });
        builder.Services.AddSingleton<CacheOptions>(new CacheOptions { DefaultCacheTimeMinutes = 5 });
        builder.Services.RegisterCache();

        return builder;
    }

    private static void ConfigureMongoDb(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(MongoDbConnectionStringName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException($"Connection string '{MongoDbConnectionStringName}' not found or is empty in ConnectionStrings.");
        }

        services.AddSingleton<IMongoClient>(sp =>
        {
            var clientSettings = MongoClientSettings.FromConnectionString(connectionString);
            return new MongoClient(clientSettings);
        });

        services.AddScoped<IMongoDatabase>(sp =>
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

        BsonSerializer.RegisterSerializer(new DictionaryInterfaceImplementerSerializer<Dictionary<int, int>>(DictionaryRepresentation.ArrayOfArrays));

        var conventionPack = new ConventionPack
        {
            new IgnoreExtraElementsConvention(true),
            new CamelCaseElementNameConvention(),  
            // Add other conventions
            // new EnumRepresentationConvention(BsonType.String)
        };

        ConventionRegistry.Register("AppConventions", conventionPack, t => true);
    }

    private static void RegisterCache(this IServiceCollection serviceCollection)
    {

        serviceCollection.AddSingleton<ICacheBase, MemoryCacheBase>();
    }

}
