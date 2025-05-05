FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY . .
WORKDIR "/app/src/Api"
RUN dotnet restore

RUN dotnet build "./Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "./Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BjjWorld.Api.dll"] 
