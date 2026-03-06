using Microsoft.Extensions.Logging;

namespace BjjEire.SharedKernel.Logging;

public static class ApplicationLogEvents {

    public static class UnhandledExceptions {
        private const int BaseId = 1000;
        public static readonly EventId HandleExceptionError = new(BaseId + 1, nameof(HandleExceptionError));
        public static readonly EventId RequestSerializationFailureWarning = new(BaseId + 2, nameof(RequestSerializationFailureWarning));
    }

    public static class Validation {
        private const int BaseId = 2000;
        public static readonly EventId Failed = new(BaseId + 4, nameof(Failed));
    }

    public static class ExceptionHandling {
        private const int BaseId = 3000;
        public static readonly EventId UnexpectedExceptionOccurred = new(BaseId + 1, nameof(UnexpectedExceptionOccurred));
        public static readonly EventId ExceptionHandled = new(BaseId + 2, nameof(ExceptionHandled));
    }

    public static class RequestHandling {
        private const int BaseId = 9000;
        public static readonly EventId Start = new(BaseId + 1, nameof(Start));
        public static readonly EventId Success = new(BaseId + 2, nameof(Success));
        public static readonly EventId Failure = new(BaseId + 3, nameof(Failure));
    }

    public static class BjjEventService {
        private const int BaseId = 8000;
        public static readonly EventId GetByIdAttempt = new(BaseId + 1, nameof(GetByIdAttempt));
        public static readonly EventId InsertAttempt = new(BaseId + 10, nameof(InsertAttempt));
        public static readonly EventId InsertSuccess = new(BaseId + 11, nameof(InsertSuccess));
        public static readonly EventId UpdateAttempt = new(BaseId + 12, nameof(UpdateAttempt));
        public static readonly EventId UpdateSuccess = new(BaseId + 13, nameof(UpdateSuccess));
        public static readonly EventId DeleteAttempt = new(BaseId + 14, nameof(DeleteAttempt));
        public static readonly EventId DeleteSuccess = new(BaseId + 15, nameof(DeleteSuccess));
    }

    public static class GymService {
        private const int BaseId = 15100;
        public static readonly EventId GetByIdAttempt = new(BaseId + 1, nameof(GetByIdAttempt));
        public static readonly EventId InsertAttempt = new(BaseId + 10, nameof(InsertAttempt));
        public static readonly EventId InsertSuccess = new(BaseId + 11, nameof(InsertSuccess));
        public static readonly EventId UpdateAttempt = new(BaseId + 12, nameof(UpdateAttempt));
        public static readonly EventId UpdateSuccess = new(BaseId + 13, nameof(UpdateSuccess));
        public static readonly EventId DeleteAttempt = new(BaseId + 14, nameof(DeleteAttempt));
        public static readonly EventId DeleteSuccess = new(BaseId + 15, nameof(DeleteSuccess));
    }

    public static class QueryHandling {
        private const int BaseId = 10000;
        public static readonly EventId Start = new(BaseId + 1, nameof(Start));
        public static readonly EventId FetchingFromRepositoryOnCacheMiss = new(BaseId + 2, nameof(FetchingFromRepositoryOnCacheMiss));
        public static readonly EventId Success = new(BaseId + 4, nameof(Success));
    }

    public static class RateLimiting {
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

    public static class ApiKey {
        private const int BaseId = 14000;
        public static readonly EventId AuthMisconfigured = new(BaseId + 1, nameof(AuthMisconfigured));
        public static readonly EventId HeaderNotFound = new(BaseId + 2, nameof(HeaderNotFound));
        public static readonly EventId HeaderEmpty = new(BaseId + 3, nameof(HeaderEmpty));
        public static readonly EventId AuthSuccess = new(BaseId + 4, nameof(AuthSuccess));
        public static readonly EventId AuthInvalid = new(BaseId + 5, nameof(AuthInvalid));
        public static readonly EventId ChallengeIssued = new(BaseId + 6, nameof(ChallengeIssued));
        public static readonly EventId ForbiddenIssued = new(BaseId + 7, nameof(ForbiddenIssued));
    }

    public static class Auth {
        private const int BaseId = 14100;
        public static readonly EventId ConfigSectionNotFound = new(BaseId + 1, nameof(ConfigSectionNotFound));
        public static readonly EventId OptionValidationFailed = new(BaseId + 2, nameof(OptionValidationFailed));
    }
}
