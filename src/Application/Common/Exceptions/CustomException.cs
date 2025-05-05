using System.Net;

namespace BjjWorld.Application.Common.Exceptions;

public class CustomException : Exception
{
    public IReadOnlyList<string> ErrorMessages { get; }
    public HttpStatusCode StatusCode { get; }

    public CustomException(
        string message,
        IEnumerable<string>? errors = null,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        : base(message)
    {
        ErrorMessages = errors?.ToList() ?? [];
        StatusCode = statusCode;
    }

    public CustomException(
        string message,
        Exception innerException,
        IEnumerable<string>? errors = null,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        : base(message, innerException)
    {
        ErrorMessages = errors?.ToList() ?? [];
        StatusCode = statusCode;
    }
}