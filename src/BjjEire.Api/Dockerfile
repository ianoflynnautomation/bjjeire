FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 appgroup \
    && useradd --system --uid 1001 --gid appgroup --no-create-home appuser

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./

COPY src/BjjEire.Api/BjjEire.Api.csproj src/BjjEire.Api/
COPY src/BjjEire.Application/BjjEire.Application.csproj src/BjjEire.Application/
COPY src/BjjEire.Infrastructure/BjjEire.Infrastructure.csproj src/BjjEire.Infrastructure/
COPY src/BjjEire.ServiceDefaults/BjjEire.ServiceDefaults.csproj src/BjjEire.ServiceDefaults/
COPY src/BjjEire.Domain/BjjEire.Domain.csproj src/BjjEire.Domain/
COPY src/BjjEire.SharedKernel/BjjEire.SharedKernel.csproj src/BjjEire.SharedKernel/

RUN dotnet restore src/BjjEire.Api/BjjEire.Api.csproj

COPY src/ src/
RUN dotnet publish src/BjjEire.Api/BjjEire.Api.csproj -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/publish .
USER appuser

CMD ["dotnet", "BjjEire.Api.dll"]
