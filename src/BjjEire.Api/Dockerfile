FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

RUN apk add --no-cache curl \
    && addgroup -S -g 1001 appgroup \
    && adduser -S -u 1001 -G appgroup -H -D appuser

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
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
ARG APP_VERSION=dev
LABEL org.opencontainers.image.version="${APP_VERSION}"
WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/publish .
USER appuser

CMD ["dotnet", "BjjEire.Api.dll"]
