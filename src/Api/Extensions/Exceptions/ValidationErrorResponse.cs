namespace BjjEire.Api.Extensions.Exceptions;

public class ValidationErrorResponse : ProblemDetails
{
    public List<ValidationError> Errors { get; set; } = [];

    public class ValidationError
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
    }
}