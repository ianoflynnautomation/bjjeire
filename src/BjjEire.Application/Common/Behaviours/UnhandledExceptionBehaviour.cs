using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

public class UnhandledExceptionBehaviour<TRequest, TResponse>(
    ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> logger,
    IHttpContextAccessor httpContextAccessor)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(next);

        try
        {
            return await next(cancellationToken);
        }
#pragma warning disable S2139
        catch (Exception ex) when (ex is not ValidationException)
        {
            var httpContext = httpContextAccessor.HttpContext;
            UnhandledExceptionBehaviourLog.UnhandledException(
                logger, ex,
                typeof(TRequest).Name,
                httpContext?.Request.Path.Value ?? "Unknown",
                httpContext?.Request.Method ?? "Unknown");
            throw;
        }
#pragma warning restore S2139
    }
}
