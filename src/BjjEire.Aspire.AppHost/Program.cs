// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Aspire.AppHost.Configuration;

using Microsoft.Extensions.Configuration;

IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

IResourceBuilder<MongoDBDatabaseResource> mongo = MongoDbConfiguration.AddMongoDb(builder);
IResourceBuilder<ContainerResource> api = ApiConfiguration.AddApi(builder, mongo);

if (!builder.Configuration.GetValue<bool>("Testing:SkipFrontend", false))
{
    _ = FrontendConfiguration.AddFrontend(builder, api);
}

await builder.Build().RunAsync();
