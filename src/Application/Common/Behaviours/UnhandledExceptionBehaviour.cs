using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BjjWorld.Application.Common.Behaviours;

public class UnhandledExceptionBehaviour<TRequest, TResponse>(ILogger<TRequest> logger, IHttpContextAccessor httpContextAccessor) 
: IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILogger<TRequest> _logger = logger;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        try
        {
            return await next();
        }
        catch (Exception ex)
        {
            var requestName = typeof(TRequest).Name;
            var httpContext = _httpContextAccessor.HttpContext;
            var traceId = httpContext?.TraceIdentifier ?? Guid.NewGuid().ToString();
            //var userId = httpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
            var requestPath = httpContext?.Request.Path.Value ?? "Unknown";
            var method = httpContext?.Request.Method ?? "Unknown";

            _logger.LogError(
                ex,
                "Unhandled exception for request {RequestName}. TraceId: {TraceId}, UserId: {UserId}, Path: {Path}, Method: {Method}",
                requestName,
                traceId,
                "",//userId,
                requestPath,
                method);

            var requestJson = SanitizeRequest(request);
            _logger.LogDebug("Request details: {RequestJson}", requestJson);

            // Rethrow to allow global exception handler to process
            throw;
        }
    }

    private string SanitizeRequest(TRequest request)
    {
        try
        {
            return JsonSerializer.Serialize(request, SerializerOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to serialize request for logging.");
            return "{ \"error\": \"Failed to serialize request\" }";
        }
    }
}