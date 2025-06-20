FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY . .
WORKDIR "/app/src/BjjEire.Api"
RUN dotnet restore

RUN dotnet build "./BjjEire.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "./BjjEire.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app

COPY --from=publish /app/publish .

CMD ["dotnet", "BjjEire.Api.dll"]
