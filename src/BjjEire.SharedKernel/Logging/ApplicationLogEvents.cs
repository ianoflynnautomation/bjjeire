
using Microsoft.Extensions.Logging;

namespace BjjEire.SharedKernel.Logging;

public static class ApplicationLogEvents {

    public static class UnhandledExceptions {
        private const int BaseId = 1000;
        public static readonly EventId HandleExceptionError = new(BaseId + 1, nameof(HandleExceptionError));
        public static readonly EventId RequestSerializationFailureWarning = new(BaseId + 2, nameof(RequestSerializationFailureWarning));
        public static readonly EventId PipelineProcessingStartInfo = new(BaseId + 3, nameof(PipelineProcessingStartInfo));
        public static readonly EventId PipelineProcessingEndInfo = new(BaseId + 4, nameof(PipelineProcessingEndInfo));
    }

    public static class Validation {
        private const int BaseId = 2000;
        public static readonly EventId ProcessStart = new(BaseId + 1, nameof(ProcessStart));
        public static readonly EventId NoValidatorsFound = new(BaseId + 2, nameof(NoValidatorsFound));
        public static readonly EventId Succeeded = new(BaseId + 3, nameof(Succeeded));
        public static readonly EventId Failed = new(BaseId + 4, nameof(Failed));
    }

    public static class ExceptionHandling {
        private const int BaseId = 3000;
        public static readonly EventId UnexpectedExceptionOccurred = new(BaseId + 1, nameof(UnexpectedExceptionOccurred));
        public static readonly EventId ExceptionHandled = new(BaseId + 2, nameof(ExceptionHandled));
    }

    public static class Cache {
        private const int GeneralOpsBaseId = 6000;
        public static readonly EventId GetAttempt = new(GeneralOpsBaseId + 1, nameof(GetAttempt));
        public static readonly EventId Hit = new(GeneralOpsBaseId + 2, nameof(Hit));
        public static readonly EventId Miss = new(GeneralOpsBaseId + 3, nameof(Miss));
        public static readonly EventId ItemSet = new(GeneralOpsBaseId + 4, nameof(ItemSet));
        public static readonly EventId RemoveAttempt = new(GeneralOpsBaseId + 5, nameof(RemoveAttempt));
        public static readonly EventId RemoveSuccess = new(GeneralOpsBaseId + 6, nameof(RemoveSuccess));

        public static readonly EventId RemoveByPrefixAttempt =
            new(GeneralOpsBaseId + 7, nameof(RemoveByPrefixAttempt));

        public static readonly EventId RemoveByPrefixItem =
            new(GeneralOpsBaseId + 8, nameof(RemoveByPrefixItem));

        public static readonly EventId RemoveByPrefixCompleted =
            new(GeneralOpsBaseId + 9, nameof(RemoveByPrefixCompleted));

        public static readonly EventId ClearAttempt = new(GeneralOpsBaseId + 10, nameof(ClearAttempt));
        public static readonly EventId ClearSuccess = new(GeneralOpsBaseId + 11, nameof(ClearSuccess));

        public static readonly EventId
            SetAttempt = new(GeneralOpsBaseId + 12, nameof(SetAttempt));

        private const int InternalsBaseId = 6100;
        public static readonly EventId SemaphoreCreated = new(InternalsBaseId + 1, nameof(SemaphoreCreated));
        public static readonly EventId SemaphoreReleased = new(InternalsBaseId + 3, nameof(SemaphoreReleased));
        public static readonly EventId ItemEvicted = new(InternalsBaseId + 4, nameof(ItemEvicted));

        public static readonly EventId ResetTokenSignaled =
            new(InternalsBaseId + 5, nameof(ResetTokenSignaled));

        public static readonly EventId NewResetToken = new(InternalsBaseId + 6, nameof(NewResetToken));
        public static readonly EventId HitAfterWait = new(InternalsBaseId + 7, nameof(HitAfterWait));
        public static readonly EventId MissAcquire = new(InternalsBaseId + 8, nameof(MissAcquire));


        public static readonly EventId InvalidationInitiated = new(InternalsBaseId + 9, nameof(MissAcquire));
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
        public static readonly EventId GetByIdNotFound = new(BaseId + 2, nameof(GetByIdNotFound));

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
        public static readonly EventId GetByIdCacheMissRepoLookup = new(BaseId + 2, nameof(GetByIdCacheMissRepoLookup));
        public static readonly EventId GetByIdFound = new(BaseId + 3, nameof(GetByIdFound));
        public static readonly EventId GetByIdNotFound = new(BaseId + 4, nameof(GetByIdNotFound));

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
        public static readonly EventId DataRetrievedAndPaginatedForCache = new(BaseId + 3, nameof(DataRetrievedAndPaginatedForCache));
        public static readonly EventId Success = new(BaseId + 4, nameof(Success));
    }

    public static class RateLimiting {
        // Configuration Time (13000-13099)
        private const int ConfigBaseId = 13000;
        public static readonly EventId GloballyDisabled = new(ConfigBaseId + 1, nameof(GloballyDisabled));
        public static readonly EventId PartitionConfigured = new(ConfigBaseId + 2, nameof(PartitionConfigured));
        public static readonly EventId RejectionStatusCodeSet = new(ConfigBaseId + 3, nameof(RejectionStatusCodeSet));
        public static readonly EventId MiddlewareApplied = new(ConfigBaseId + 4, nameof(MiddlewareApplied));
        public static readonly EventId MiddlewareSkipped = new(ConfigBaseId + 5, nameof(MiddlewareSkipped));

        // Runtime - OnRejected (13100-13199)
        private const int RejectedBaseId = 13100;
        public static readonly EventId Rejected = new(RejectedBaseId + 1, nameof(Rejected));
        public static readonly EventId HeadersSetDebug = new(RejectedBaseId + 2, nameof(HeadersSetDebug));
        public static readonly EventId RetryAfterFound = new(RejectedBaseId + 3, nameof(RetryAfterFound));
        public static readonly EventId RetryAfterNotFoundWarning = new(RejectedBaseId + 4, nameof(RetryAfterNotFoundWarning));
        public static readonly EventId ProblemDetailsSummary = new(RejectedBaseId + 5, nameof(ProblemDetailsSummary));
        public static readonly EventId ProblemDetailsJsonDebug = new(RejectedBaseId + 6, nameof(ProblemDetailsJsonDebug));
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

        // JWT Bearer Events (14150 - 14199)
        private const int JwtBaseId = 14150;
        public static readonly EventId JwtAuthFailed = new(JwtBaseId + 1, nameof(JwtAuthFailed));
        public static readonly EventId JwtTokenValidated = new(JwtBaseId + 2, nameof(JwtTokenValidated));
        public static readonly EventId JwtChallengeIssued = new(JwtBaseId + 3, nameof(JwtChallengeIssued));
    }
}
