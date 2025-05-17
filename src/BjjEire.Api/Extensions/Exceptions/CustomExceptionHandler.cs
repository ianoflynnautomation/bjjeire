
using System.Security.Claims;
using BjjEire.Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;

namespace BjjEire.Api.Extensions.Exceptions;

public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger, IHostEnvironment environment) : IExceptionHandler {
    private readonly ILogger<CustomExceptionHandler> _logger = logger;
    private readonly IHostEnvironment _environment = environment;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);

        ProblemDetails problemDetails = exception switch {
            ValidationException validationEx => HandleValidationException(validationEx, httpContext),
            CustomException customEx => HandleCustomException(customEx, httpContext),
            UnauthorizedAccessException => HandleUnauthorizedAccessException(httpContext),
            NotFoundException notFoundEx => HandleNotFoundException(notFoundEx, httpContext),
            _ => HandleUnexpectedException(exception, httpContext),
        };

        LogException(exception, httpContext, problemDetails);

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, problemDetails.GetType(), cancellationToken: cancellationToken);

        return true;
    }

    private static ValidationErrorResponse HandleValidationException(ValidationException exception, HttpContext httpContext) {
#pragma warning disable CS8601 // Possible null reference assignment.
        var validationErrors = exception.Errors.Select(e => new ValidationErrorResponse.ValidationErrorDetail {
            Field = string.IsNullOrWhiteSpace(e.PropertyName) ? null : e.PropertyName,
            Message = e.ErrorMessage,
            ErrorCode = e.ErrorCode
        }).ToList();
#pragma warning restore CS8601 // Possible null reference assignment.

        return new ValidationErrorResponse {
            Type = "urn:bjjeire:validation-error",
            Title = "Validation Failed",
            Status = StatusCodes.Status400BadRequest,
            Detail = "One or more validation errors occurred. Please see the 'errors' property for details.",
            Instance = httpContext.TraceIdentifier,
            Errors = validationErrors
        };
    }

    private static ProblemDetails HandleCustomException(CustomException exception, HttpContext httpContext) {
        var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails {
            Type = exception.Type ?? "urn:bjjeire:application-error",
            Title = exception.Title ?? "Application Error",
            Status = (int)exception.StatusCode,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };

        if (exception.ErrorMessages?.Any() == true) {
            problemDetails.Extensions["details"] = exception.ErrorMessages;
        }
        return problemDetails;
    }

    private static ProblemDetails HandleUnauthorizedAccessException(HttpContext httpContext) {

        var status = StatusCodes.Status401Unauthorized;
        var title = "Unauthorized";
        var detail = "Authentication is required and has failed or has not yet been provided.";
        var type = "https://tools.ietf.org/html/rfc7235#section-3.1";

        if (httpContext.User.Identity?.IsAuthenticated == true) {
            status = StatusCodes.Status403Forbidden;
            title = "Forbidden";
            detail = "You do not have permission to perform this action.";
            type = "https://tools.ietf.org/html/rfc7231#section-6.5.3";
        }

        return new ProblemDetails {
            Type = type,
            Title = title,
            Status = status,
            Detail = detail,
            Instance = httpContext.TraceIdentifier
        };
    }

    private static ProblemDetails HandleNotFoundException(NotFoundException exception, HttpContext httpContext) {
        return new ProblemDetails {
            Type = "urn:bjjeire:not-found",
            Title = "Resource Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };
    }

    private ProblemDetails HandleUnexpectedException(Exception exception, HttpContext httpContext) {
        var errorId = Guid.NewGuid().ToString();
        var title = "Internal Server Error";
        string detail = _environment.IsDevelopment() || _environment.IsEnvironment("Docker")
            ? $"Unhandled Exception ({errorId}): {exception}"
            : $"An unexpected error occurred. Please contact support with Error ID: {errorId}.";
        var problemDetails = new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = title,
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
            Instance = httpContext.TraceIdentifier
        };
        _logger.LogError(exception, "Unexpected error occurred. Error ID: {ErrorId} for TraceId: {TraceId}", errorId, httpContext.TraceIdentifier);


        return problemDetails;
    }

    private void LogException(Exception exception, HttpContext httpContext, ProblemDetails problemDetails) {
        var logLevel = problemDetails.Status >= 500 ? LogLevel.Error : LogLevel.Warning;
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";

        _logger.Log(logLevel, exception,
            "ExceptionHandler handled error: User: {UserId}, Request: {RequestMethod} {RequestPath}, Status: {StatusCode}, TraceId: {TraceId}, Title: {ErrorTitle}, ClientDetail: {ErrorClientDetail}",
            userId,
            httpContext.Request.Method,
            httpContext.Request.Path,
            problemDetails.Status,
            httpContext.TraceIdentifier,
            problemDetails.Title,
            problemDetails.Detail);
    }
}

public class ValidationErrorResponse : ProblemDetails {
    public List<ValidationErrorDetail> Errors { get; set; } = [];

    public class ValidationErrorDetail {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
    }
}