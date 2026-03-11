using BjjEire.Aspire.AppHost.Configuration;

using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

var mongo = MongoDbConfiguration.AddMongoDb(builder);
var api = ApiConfiguration.AddApi(builder, mongo);

if (!builder.Configuration.GetValue<bool>("Testing:SkipFrontend", false))
{
    FrontendConfiguration.AddFrontend(builder, api);
}

await builder.Build().RunAsync();
