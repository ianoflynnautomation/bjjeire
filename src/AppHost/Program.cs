var builder = DistributedApplication.CreateBuilder(args);

// builder.AddContainer("grafana", "grafana/grafana")
//        .WithBindMount("../../infra/grafana/config", "/etc/grafana", isReadOnly: true)
//        .WithBindMount("../../infra/grafana/dashboards", "/var/lib/grafana/dashboards", isReadOnly: true)
//        .WithHttpEndpoint(port: 3200, targetPort: 3000, name: "http");

// builder.AddContainer("prometheus", "prom/prometheus")
//        .WithBindMount("../../infra/prometheus", "/etc/prometheus", isReadOnly: true)
//        .WithHttpEndpoint(port: 9090, targetPort: 9090);

// builder.AddContainer("prometheus", "prom/prometheus:v2.47.0")
//        .WithBindMount("/absolute/path/to/infra/prometheus/prometheus.yml", "/etc/prometheus/prometheus.yml", isReadOnly: true)
//        .WithVolumeMount("prometheus-data", "/prometheus")
//        .WithHttpEndpoint(port: 9090, targetPort: 9090);

// builder.AddContainer("loki", "grafana/loki:3.1.0")
//        .WithBindMount("/absolute/path/to/infra/loki/loki.yml", "/mnt/config/loki-config.yml", isReadOnly: true)
//        .WithVolumeMount("loki-index", "/loki/index")
//        .WithVolumeMount("loki-chunks", "/loki/chunks")
//        .WithVolumeMount("loki-rules", "/loki/rules")
//        .WithVolumeMount("loki-wal", "/loki/wal")
//        .WithVolumeMount("loki-compactor", "/loki/compactor")
//        .WithHttpEndpoint(port: 3100, targetPort: 3100)
//        .WithArgs("-config.file=/mnt/config/loki-config.yml");

// builder.AddContainer("jaeger", "jaegertracing/all-in-one:latest")
//        .WithBindMount("/absolute/path/to/infra/jaeger/jaeger-ui.json", "/etc/jaeger/jaeger-ui.json", isReadOnly: true)
//        .WithEnvironment("METRICS_STORAGE_TYPE", "prometheus")
//        .WithEnvironment("PROMETHEUS_SERVER_URL", "http://prometheus:9090")
//        .WithEnvironment("COLLECTOR_OTLP_ENABLED", "true")
//        .WithHttpEndpoint(port: 16686, targetPort: 16686)
//        .WithHttpEndpoint(port: 4317, targetPort: 4317)
//        .WithArgs("--query.ui-config", "/etc/jaeger/jaeger-ui.json")
//        .WithReference(builder.AddContainer("prometheus", "prom/prometheus:v2.47.0"));
       

var mongo = builder.AddMongoDB("mongo").WithLifetime(ContainerLifetime.Persistent);
var mongodb = mongo.AddDatabase("Mongodb");

var bjjWordApi = builder
    .AddProject<Projects.Api>("api")
    .WithExternalHttpEndpoints()
    .WithReference(mongodb)
     .WaitFor(mongodb);

builder.AddNpmApp("react", "../bjjworld-app")
    .WithReference(bjjWordApi)
    .WaitFor(bjjWordApi)
    .WithEnvironment("BROWSER", "none")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

await builder.Build().RunAsync();

