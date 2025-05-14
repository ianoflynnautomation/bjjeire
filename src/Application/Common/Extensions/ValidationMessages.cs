namespace BjjWorld.Application.Common.Extensions;

public static class ValidationMessages {
    public static class Common {
        public const string InvalidInput = "INVALID_INPUT";
    }

    public static class Required {
        public const string ErrorCode = "FIELD_REQUIRED";
        public static string Message(string fieldName) => $"{fieldName} is required.";
    }

    public static class MaxLength {
        public const string ErrorCode = "MAX_LENGTH_EXCEEDED";
        public static string Message(string fieldName, int maxLength) => $"{fieldName} cannot exceed {maxLength} characters.";
    }

    public static class InvalidEnum {
        public const string ErrorCode = "INVALID_ENUM";
        public static string Message(string fieldName) => $"Invalid {fieldName}.";
    }

    public static class InvalidUrl {
        public const string ErrorCode = "INVALID_URL";
        public static string Message(string fieldName) => $"{fieldName} must be a valid URL.";
    }

    public static class ConditionalRequired {
        public const string ErrorCode = "CONDITIONAL_FIELD_REQUIRED";
        public static string Message(string fieldName, string condition) => $"{fieldName} is required when {condition}.";
    }

    public static class GreaterThan {
        public const string ErrorCode = "GREATER_THAN";
        public static string Message(string fieldName, string comparedTo) => $"{fieldName} must be greater than {comparedTo}.";
    }

    public static class GreaterThanOrEqual {
        public const string ErrorCode = "GREATER_THAN_OR_EQUAL";
        public static string Message(string fieldName, string comparedTo) => $"{fieldName} must be on or after {comparedTo}.";
    }

    public static class NonNegative {
        public const string ErrorCode = "NON_NEGATIVE";
        public static string Message(string fieldName) => $"{fieldName} must be non-negative.";
    }

    public static class PositiveOrNull {
        public const string ErrorCode = "POSITIVE_OR_NULL";
        public static string Message(string fieldName, string condition) => $"{fieldName} must be null or positive when {condition}.";
    }

    public static class InvalidFormat {
        public const string ErrorCode = "INVALID_FORMAT";
        public static string Message(string fieldName, string format) => $"{fieldName} must be a valid {format}.";
    }

    public static class LengthRange {
        public const string ErrorCode = "LENGTH_RANGE";
        public static string Message(string fieldName, int min, int max) => $"{fieldName} must be between {min} and {max} characters.";
    }

    public static class NotNull {
        public const string ErrorCode = "NOT_NULL";
        public static string Message(string fieldName) => $"{fieldName} cannot be null.";
    }

    public static class NoNullEntries {
        public const string ErrorCode = "NO_NULL_ENTRIES";
        public static string Message(string fieldName) => $"{fieldName} cannot contain null entries.";
    }

    public static class MustBeNull {
        public const string ErrorCode = "MUST_BE_NULL";
        public static string Message(string fieldName, string condition) => $"{fieldName} must be null when {condition}.";
    }

    public static class InvalidEmail {
        public const string ErrorCode = "INVALID_EMAIL";
        public static string Message(string fieldName) => $"{fieldName} must be a valid email address.";
    }

    public static class MustBeEqualString {
        public const string ErrorCode = "VALUE_MUST_BE_EQUAL";
        public static string Message(string expectedValue) => $"{{PropertyName}} must be '{expectedValue}'.";
    }

    public static class NumericRange {
        public const string ErrorCode = "VALUE_OUT_OF_RANGE";
        public static string Message(object from, object to) => $"{{PropertyName}} must be between {from} and {to} (inclusive).";
    }

    public static class ObjectValidation {
        public const string InvalidScheduleErrorCode = "INVALID_SCHEDULE";
        public static string InvalidScheduleMessage => "The schedule information is invalid.";

        public const string InvalidContactErrorCode = "INVALID_CONTACT";
        public static string InvalidContactMessage => "The contact information is invalid.";

        public const string InvalidPricingErrorCode = "INVALID_PRICING";
        public static string InvalidPricingMessage => "The pricing model is invalid.";
    }
}