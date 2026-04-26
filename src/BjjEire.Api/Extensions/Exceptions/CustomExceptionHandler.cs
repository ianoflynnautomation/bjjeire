// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using System.Diagnostics;

using BjjEire.Application.Common.Exceptions;


namespace BjjEire.Api.Extensions.Exceptions;

public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger, IHostEnvironment environment)
    : IExceptionHandler
{

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);

        if (httpContext.Response.HasStarted)
        {
            return false;
        }

        if (exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested)
        {
            httpContext.Response.StatusCode = 499;
            return true;
        }

        string userId = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";

        ProblemDetails problemDetails = exception switch
        {
            ValidationException validationEx => HandleValidationException(validationEx, httpContext),
            CustomException customEx => HandleCustomException(customEx, httpContext),
            UnauthorizedAccessException => HandleUnauthorizedAccessException(httpContext),
            ConcurrencyException concurrencyEx => HandleConcurrencyException(concurrencyEx, httpContext),
            NotFoundException notFoundEx => HandleNotFoundException(notFoundEx, httpContext),
            _ => HandleUnexpectedException(exception, httpContext, userId),
        };

        LogHandledException(exception, httpContext, problemDetails, userId);

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, problemDetails.GetType(), cancellationToken: cancellationToken);

        return true;
    }

    private static ValidationErrorResponse HandleValidationException(ValidationException exception, HttpContext httpContext)
    {
        List<ValidationErrorResponse.ValidationErrorDetail> validationErrors = exception.Errors.Select(e => new ValidationErrorResponse.ValidationErrorDetail
        {
            Field = e.PropertyName ?? string.Empty,
            Message = e.ErrorMessage ?? string.Empty,
            ErrorCode = e.ErrorCode ?? string.Empty
        }).ToList();

        ValidationErrorResponse response = new()
        {
            Type = "urn:bjjeire:validation-error",
            Title = "Validation Failed",
            Status = StatusCodes.Status400BadRequest,
            Detail = "One or more validation errors occurred. Please see the 'errors' property for details.",
            Instance = httpContext.Request.Path,
            Errors = validationErrors
        };
        AttachTraceId(response, httpContext);
        return response;
    }

    private static ProblemDetails HandleCustomException(CustomException exception, HttpContext httpContext)
    {
        ProblemDetails problemDetails = new()
        {
            Type = exception.Type ?? "urn:bjjeire:application-error",
            Title = exception.Title ?? "Application Error",
            Status = (int)exception.StatusCode,
            Detail = exception.Message,
            Instance = httpContext.Request.Path
        };

        if (exception.ErrorMessages?.Any() == true)
        {
            problemDetails.Extensions["details"] = exception.ErrorMessages;
        }
        AttachTraceId(problemDetails, httpContext);
        return problemDetails;
    }

    private static ProblemDetails HandleUnauthorizedAccessException(HttpContext httpContext)
    {
        int status = StatusCodes.Status401Unauthorized;
        string title = "Unauthorized";
        string detail = "Authentication is required and has failed or has not yet been provided.";
        string type = "https://datatracker.ietf.org/doc/html/rfc7235#section-3.1";

        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            status = StatusCodes.Status403Forbidden;
            title = "Forbidden";
            detail = "You do not have permission to perform this action.";
            type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.3";
        }

        ProblemDetails problemDetails = new()
        {
            Type = type,
            Title = title,
            Status = status,
            Detail = detail,
            Instance = httpContext.Request.Path
        };
        AttachTraceId(problemDetails, httpContext);
        return problemDetails;
    }

    private static ProblemDetails HandleNotFoundException(NotFoundException exception, HttpContext httpContext)
    {
        ProblemDetails problemDetails = new()
        {
            Type = "urn:bjjeire:not-found",
            Title = "Resource Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = exception.Message,
            Instance = httpContext.Request.Path
        };
        AttachTraceId(problemDetails, httpContext);
        return problemDetails;
    }

    private ProblemDetails HandleUnexpectedException(Exception exception, HttpContext httpContext, string userId)
    {
        string errorId = Guid.NewGuid().ToString();
        const string title = "Internal Server Error";
        string detail = environment.IsDevelopment() || environment.IsEnvironment("Docker")
        ? $"Unhandled Exception. Error ID: {errorId}. Details: {exception}"
        : $"An unexpected error occurred. Please contact support with Error ID: {errorId}.";

        ProblemDetails problemDetails = new()
        {
            Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
            Title = title,
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
            Instance = httpContext.Request.Path
        };
        problemDetails.Extensions["errorId"] = errorId;
        AttachTraceId(problemDetails, httpContext);
        return problemDetails;
    }

    private static void AttachTraceId(ProblemDetails problemDetails, HttpContext httpContext)
    {
        string traceId = Activity.Current?.TraceId.ToString() ?? httpContext.TraceIdentifier;
        problemDetails.Extensions["traceId"] = traceId;
    }

    private void LogHandledException(Exception exception, HttpContext httpContext, ProblemDetails problemDetails, string userId)
    {
        string exType = exception.GetType().FullName ?? exception.GetType().Name;
        string traceId = httpContext.TraceIdentifier;

        if (problemDetails.Status >= 500)
        {
            CustomExceptionHandlerLog.ExceptionHandledError(
                logger, exception,
                exType, exception.Message, userId,
                httpContext.Request.Method, httpContext.Request.Path,
                problemDetails.Status, problemDetails.Title, traceId);
        }
        else
        {
            CustomExceptionHandlerLog.ExceptionHandledWarning(
                logger, exception,
                exType, exception.Message, userId,
                httpContext.Request.Method, httpContext.Request.Path,
                problemDetails.Status, problemDetails.Title, traceId);
        }
    }

    private static ProblemDetails HandleConcurrencyException(ConcurrencyException exception, HttpContext httpContext)
    {
        return new ProblemDetails
        {
            Type = "urn:bjjeire:conflict",
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };
    }
}

public class ValidationErrorResponse : ProblemDetails
{
    public List<ValidationErrorDetail> Errors { get; set; } = [];

    public class ValidationErrorDetail
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
    }
}
