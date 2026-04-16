using BjjEire.ServiceDefaults;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults(options =>
    builder.Configuration.GetSection("ServiceDefaults").Bind(options));
builder.AddInfrastructureServices();
builder.AddApplicationServices();
builder.AddApiServices();

WebApplication app = builder.Build();
app.UseBjjEireApp();
await app.RunAsync();
