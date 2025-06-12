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
app.Run();

public static partial class Program { }
