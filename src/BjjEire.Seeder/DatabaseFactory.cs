namespace BjjEire.Seeder;

internal static class DatabaseFactory
{
    internal static IMongoDatabase Build()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("Mongodb")
            ?? throw new InvalidOperationException("Connection string 'Mongodb' is missing from appsettings.json.");

        var dbName = MongoUrl.Create(connectionString).DatabaseName;
        if (string.IsNullOrWhiteSpace(dbName))
            throw new InvalidOperationException(
                "Database name must be included in the connection string. " +
                "Example: mongodb://localhost:27017/bjjeire");

        RegisterConventions();

        return new MongoClient(connectionString).GetDatabase(dbName);
    }

    private static void RegisterConventions()
    {
        var pack = new ConventionPack
        {
            new IgnoreExtraElementsConvention(true),
            new CamelCaseElementNameConvention(),
            new EnumRepresentationConvention(BsonType.String),
        };
        ConventionRegistry.Register("SeederConventions", pack, _ => true);
    }
}
