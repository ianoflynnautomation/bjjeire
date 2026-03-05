using BjjEire.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults(options => {
    options.ServiceName = "BjjEire.Api";
    options.EnablePrometheus = true;
    options.AllowedSchemes = ["https"];
});
builder.AddInfrastructureServices();
builder.AddApplicationServices();
builder.AddApiServices();

var app = builder.Build();
app.UseBjjEiredApp();
await app.RunAsync();

public partial class Program { protected Program() { } }
