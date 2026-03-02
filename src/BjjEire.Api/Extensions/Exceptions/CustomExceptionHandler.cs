
using BjjEire.Application.Common.Exceptions;
using BjjEire.SharedKernel.Logging;


namespace BjjEire.Api.Extensions.Exceptions;

public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger, IHostEnvironment environment)
    : IExceptionHandler {
    private readonly ILogger<CustomExceptionHandler> _logger = logger;
    private readonly IHostEnvironment _environment = environment;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);

        var userId = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";

        var problemDetails = exception switch {
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

    private static ValidationErrorResponse HandleValidationException(ValidationException exception, HttpContext httpContext) {
        var validationErrors = exception.Errors.Select(e => new ValidationErrorResponse.ValidationErrorDetail {
            Field = e.PropertyName ?? string.Empty,
            Message = e.ErrorMessage ?? string.Empty,
            ErrorCode = e.ErrorCode ?? string.Empty
        }).ToList();

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

    private ProblemDetails HandleUnexpectedException(Exception exception, HttpContext httpContext, string userId) {
        var errorId = Guid.NewGuid().ToString();
        const string title = "Internal Server Error";
        var detail = _environment.IsDevelopment() || _environment.IsEnvironment("Docker")
            ? $"Unhandled Exception. Error ID: {errorId}. Details: {exception}"
            : $"An unexpected error occurred. Please contact support with Error ID: {errorId}.";

        _logger.LogError(ApplicationLogEvents.ExceptionHandling.UnexpectedExceptionOccurred, exception,
            "Unexpected error occurred. ErrorId: {ErrorId}, Request: {RequestMethod} {RequestPath}, ASPNetTraceId: {ASPNetTraceId}, UserId: {UserId}",
            errorId,
            httpContext.Request.Method,
            httpContext.Request.Path,
            httpContext.TraceIdentifier,
            userId);

        return new ProblemDetails {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = title,
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
            Instance = httpContext.TraceIdentifier
        };
    }

    private void LogHandledException(Exception exception, HttpContext httpContext, ProblemDetails problemDetails, string userId) {
        var logLevel = problemDetails.Status >= 500 ? LogLevel.Error : LogLevel.Warning;

        _logger.Log(logLevel, ApplicationLogEvents.ExceptionHandling.ExceptionHandled, exception,
            "ExceptionHandler handled an error. ExceptionType: {ExceptionType}, OriginalExceptionMessage: \"{OriginalExceptionMessage}\", UserId: {UserId}, Request: {RequestMethod} {RequestPath}, ResponseStatus: {ResponseStatusCode}, ResponseTitle: \"{ResponseErrorTitle}\", ClientFacingDetail: \"{ClientFacingDetail}\", ASPNetTraceId: {ASPNetTraceId}",
            exception.GetType().FullName,
            exception.Message,
            userId,
            httpContext.Request.Method,
            httpContext.Request.Path,
            problemDetails.Status,
            problemDetails.Title,
            problemDetails.Detail,
            httpContext.TraceIdentifier
        );
    }

    private static ProblemDetails HandleConcurrencyException(ConcurrencyException exception, HttpContext httpContext) {
        return new ProblemDetails {
            Type = "urn:bjjeire:conflict",
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = exception.Message,
            Instance = httpContext.TraceIdentifier
        };
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
