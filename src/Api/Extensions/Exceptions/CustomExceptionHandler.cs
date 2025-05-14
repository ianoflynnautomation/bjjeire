
using BjjWorld.Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;

namespace BjjWorld.Api.Extensions.Exceptions;

public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger, IHostEnvironment environment) : IExceptionHandler {
    private readonly ILogger<CustomExceptionHandler> _logger = logger;
    private readonly IHostEnvironment _environment = environment;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(httpContext);

        _ = new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Instance = httpContext.TraceIdentifier
        };
        ProblemDetails? problemDetails = exception switch {
            ValidationException validationException => HandleValidationException(validationException, httpContext),
            CustomException customException => HandleCustomException(customException, httpContext),
            UnauthorizedAccessException => HandleUnauthorizedException(httpContext),
            NotFoundException notFoundException => HandleNotFoundException(notFoundException, httpContext),
            _ => HandleUnexpectedException(exception, httpContext),
        };
        LogException(exception, httpContext, problemDetails);

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static ProblemDetails HandleValidationException(ValidationException exception, HttpContext httpContext) {
        var validationErrors = exception.Errors.Select(e => new ValidationErrorResponse.ValidationError {
            Field = e.PropertyName,
            Message = e.ErrorMessage,
            ErrorCode = e.ErrorCode
        }).ToList();

        return new ValidationErrorResponse {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "Validation Failed",
            Status = StatusCodes.Status400BadRequest,
            Detail = "One or more validation errors occurred.",
            Instance = httpContext.TraceIdentifier,
            Errors = validationErrors
        };
    }

    private static ProblemDetails HandleCustomException(CustomException exception, HttpContext httpContext) {
        var problemDetails = new ProblemDetails {
            Type = exception.Type ?? "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = exception.Title ?? "Bad Request",
            Status = (int)exception.StatusCode,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };

        if (exception.ErrorMessages?.Any() == true) {
            problemDetails.Extensions["errors"] = exception.ErrorMessages;
        }

        return problemDetails;
    }

    private static ProblemDetails HandleUnauthorizedException(HttpContext httpContext) {
        return new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
            Title = "Unauthorized",
            Status = StatusCodes.Status401Unauthorized,
            Detail = "You are not authorized to perform this action.",
            Instance = httpContext.TraceIdentifier
        };
    }

    private static ProblemDetails HandleNotFoundException(NotFoundException exception, HttpContext httpContext) {
        return new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            Title = "Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };
    }

    private ProblemDetails HandleUnexpectedException(Exception exception, HttpContext httpContext) {
        var statusCode = StatusCodes.Status500InternalServerError;
        var detail = _environment.IsDevelopment()
            ? exception.ToString()
            : "An unexpected error occurred. Please try again later.";

        return new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "Internal Server Error",
            Status = statusCode,
            Detail = detail,
            Instance = httpContext.TraceIdentifier
        };
    }

    private void LogException(Exception exception, HttpContext httpContext, ProblemDetails problemDetails) {
        var logLevel = exception is ValidationException or CustomException
            ? LogLevel.Warning
            : LogLevel.Error;

        _logger.Log(
            logLevel,
            exception,
            "HTTP {Method} {Path} failed with status {StatusCode}. Detail: {Detail}",
            httpContext.Request.Method,
            httpContext.Request.Path,
            problemDetails.Status,
            problemDetails.Detail);
    }
}