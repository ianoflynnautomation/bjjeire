using BjjEire.Aspire.AppHost.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

var mongo = MongoDbConfiguration.AddMongoDb(builder);
var api = ApiConfiguration.AddApi(builder, mongo);
FrontendConfiguration.AddFrontend(builder, api);

await builder.Build().RunAsync();
