var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddInfrastructureServices();
builder.AddApplicationServices();
builder.AddApiServices();

var app = builder.Build();
app.UseBjjWorldApp();
app.Run();

public partial class Program { }
