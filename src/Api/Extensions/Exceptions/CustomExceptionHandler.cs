
using BjjWorld.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;

namespace BjjWorld.Api.Extensions;
public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);
        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path
        };

        if (exception is FluentValidation.ValidationException fluentException)
        {
            problemDetails.Detail = "one or more validation errors occurred";
            problemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            List<string> validationErrors = [];
            foreach (var error in fluentException.Errors)
            {
                validationErrors.Add(error.ErrorMessage);
            }
            problemDetails.Extensions.Add("errors", validationErrors);
        }

        else if (exception is CustomException e)
        {
            httpContext.Response.StatusCode = (int)e.StatusCode;
            problemDetails.Detail = e.Message;
            if (e.ErrorMessages != null && e.ErrorMessages.Any())
            {
                problemDetails.Extensions.Add("errors", e.ErrorMessages);
            }
        }

        else
        {
            problemDetails.Detail = exception.Message;
        }

        logger.LogError("{ProblemDetail}", problemDetails.Detail);
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken).ConfigureAwait(false);
        return true;
    }
}