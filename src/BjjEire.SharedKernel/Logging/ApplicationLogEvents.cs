using Microsoft.Extensions.Logging;

namespace BjjEire.SharedKernel.Logging;

public static class ApplicationLogEvents
{

    public static class ExceptionHandling
    {
        private const int BaseId = 3000;
        public static readonly EventId UnexpectedExceptionOccurred = new(BaseId + 1, nameof(UnexpectedExceptionOccurred));
        public static readonly EventId ExceptionHandled = new(BaseId + 2, nameof(ExceptionHandled));
    }

    public static class RateLimiting
    {
        private const int ConfigBaseId = 13000;
        public static readonly EventId GloballyDisabled = new(ConfigBaseId + 1, nameof(GloballyDisabled));
        public static readonly EventId PartitionConfigured = new(ConfigBaseId + 2, nameof(PartitionConfigured));
        public static readonly EventId RejectionStatusCodeSet = new(ConfigBaseId + 3, nameof(RejectionStatusCodeSet));
        public static readonly EventId MiddlewareApplied = new(ConfigBaseId + 4, nameof(MiddlewareApplied));
        public static readonly EventId MiddlewareSkipped = new(ConfigBaseId + 5, nameof(MiddlewareSkipped));

        private const int RejectedBaseId = 13100;
        public static readonly EventId Rejected = new(RejectedBaseId + 1, nameof(Rejected));
        public static readonly EventId RetryAfterFound = new(RejectedBaseId + 3, nameof(RetryAfterFound));
        public static readonly EventId RetryAfterNotFoundWarning = new(RejectedBaseId + 4, nameof(RetryAfterNotFoundWarning));
        public static readonly EventId ResponseStartedWarning = new(RejectedBaseId + 7, nameof(ResponseStartedWarning));
        public static readonly EventId RejectionSent = new(RejectedBaseId + 8, nameof(RejectionSent));
        public static readonly EventId RejectionHandlerError = new(RejectedBaseId + 9, nameof(RejectionHandlerError));
        public static readonly EventId RejectionHandlerWriteError = new(RejectedBaseId + 10, nameof(RejectionHandlerWriteError));
    }

    public static class Auth
    {
        private const int BaseId = 14100;
        public static readonly EventId ConfigSectionNotFound = new(BaseId + 1, nameof(ConfigSectionNotFound));
        public static readonly EventId OptionValidationFailed = new(BaseId + 2, nameof(OptionValidationFailed));
    }
}
