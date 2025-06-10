using BjjEire.Aspire.AppHost.Configuration;

var builder = DistributedApplication.CreateBuilder(args);
// Configure services
ServiceConfiguration.ConfigureServices(builder);
// Add observability
ObservabilityConfiguration.AddObservability(builder);
// Add database
var mongo = MongoDbConfiguration.AddMongoDb(builder);
// Add Postgres
PostgresConfiguration.AddPostgres(builder);
// Add API
var api = ApiConfiguration.AddApi(builder, mongo);
// Add frontend
FrontendConfiguration.AddFrontend(builder, api);

await builder.Build().RunAsync();

