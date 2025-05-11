using System.Net;

namespace BjjWorld.Application.Common.Exceptions;

public class CustomException(
    string message,
    HttpStatusCode statusCode = HttpStatusCode.BadRequest,
    string? type = null,
    string? title = null,
    IEnumerable<string>? errorMessages = null) : Exception(message)
{
    public HttpStatusCode StatusCode { get; } = statusCode;
    public string? Type { get; } = type;
    public string? Title { get; } = title;
    public IEnumerable<string>? ErrorMessages { get; } = errorMessages;
}