// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

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
        catch (Exception ex) when (ex is not ValidationException)
        {
            HttpContext? httpContext = httpContextAccessor.HttpContext;
            UnhandledExceptionBehaviourLog.UnhandledException(
                logger, ex,
                typeof(TRequest).Name,
                httpContext?.Request.Path.Value ?? "Unknown",
                httpContext?.Request.Method ?? "Unknown");
            throw;
        }
    }
}
