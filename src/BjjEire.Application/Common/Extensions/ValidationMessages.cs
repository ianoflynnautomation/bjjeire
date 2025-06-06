// Copyright (c) {year} BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Globalization;

namespace BjjEire.Application.Common.Extensions;

public static class ValidationMessages
{
  public static class Required
  {
    public const string ErrorCode = "FIELD_REQUIRED";
    public static string Message => "{PropertyName} is required.";
  }

  public static class MaxLength
  {
    public const string ErrorCode = "MAX_LENGTH_EXCEEDED";
    public static string Message(int maxLength) => $"{{PropertyName}} cannot exceed {maxLength} characters.";
  }

  public static class Invalid
  {
    public const string ErrorCode = "INVALID_ENUM";
    public static string Message => "Invalid {PropertyName}.";
  }

  public static class InvalidUrl
  {
    public const string ErrorCode = "INVALID_URL";
    public static string Message => "{PropertyName} must be a valid URL.";
  }

  public static class ConditionalRequired
  {
    public const string ErrorCode = "CONDITIONAL_FIELD_REQUIRED";
    public static string Message(string fieldName, string condition) => $"{fieldName} is required when {condition}.";
  }

  public static class GreaterThan
  {
    public const string ErrorCode = "GREATER_THAN";
    public static string Message(string comparedTo) => $"{{PropertyName}} must be greater than {comparedTo}.";
  }

  public static class GreaterThanOrEqual
  {
    public const string ErrorCode = "GREATER_THAN_OR_EQUAL";
    public static string Message(string comparedTo) => $"{{PropertyName}} must be on or after {comparedTo}.";
  }

  public static class NonNegative
  {
    public const string ErrorCode = "NON_NEGATIVE";
    public static string Message => "{PropertyName} must be non-negative.";
  }

  public static class PositiveOrNull
  {
    public const string ErrorCode = "POSITIVE_OR_NULL";
    public static string Message(string condition) => $"{{PropertyName}} must be null or positive when {condition}.";
  }

  public static class InvalidFormat
  {
    public const string ErrorCode = "INVALID_FORMAT";
    public static string Message(string format) => $"{{PropertyName}} must be a valid {format}.";
  }

  public static class LengthRange
  {
    public const string ErrorCode = "LENGTH_RANGE";
    public static string Message(int min, int max) => $"{{PropertyName}} must be between {min} and {max} characters.";
  }

  public static class NotNull
  {
    public const string ErrorCode = "NOT_NULL";
    public static string Message => "{PropertyName} cannot be null.";
  }

  public static class NoNullEntries
  {
    public const string ErrorCode = "NO_NULL_ENTRIES";
    public static string Message => "{PropertyName} cannot contain null entries.";
  }

  public static class MustBeNull
  {
    public const string ErrorCode = "MUST_BE_NULL";
    public static string Message(string condition) => $"{{PropertyName}} must be null when {condition}.";
  }

  public static class InvalidEmail
  {
    public const string ErrorCode = "INVALID_EMAIL";
    public static string Message => "{PropertyName} must be a valid email address.";
  }

  public static class MustBeEqualString
  {
    public const string ErrorCode = "VALUE_MUST_BE_EQUAL";
    public static string Message(string expectedValue) => $"{{PropertyName}} must be '{expectedValue}'.";
  }

  public static class NumericRange
  {
    public const string ErrorCode = "VALUE_OUT_OF_RANGE";
    public static string Message(object from, object to) => $"{{PropertyName}} must be between {from} and {to} (inclusive).";
  }

  public static class MustBeSpecificValueWhen
  {
    public static string ErrorCode(object value) => $"MUST_BE_{value.ToString()?.ToUpper(CultureInfo.CurrentCulture)}_WHEN";
    public static string Message(object value, string condition) => $"{{PropertyName}} must be {value} when {condition}.";
  }

  public static class InclusiveBetweenValue
  {
      public const string ErrorCode = "INCLUSIVE_BETWEEN_VALUE";
      public static string Message(object from, object to) => $"{{PropertyName}} must be between {from} and {to} inclusive.";
  }

  public static class MustBePositiveValueWhen
  {
    public const string ErrorCode = "MUST_BE_POSITIVE_WHEN";
    public static string Message(string condition) => $"{{PropertyName}} must be greater than 0 when {condition}.";
  }

  public static class ObjectValidation
  {
    public const string InvalidScheduleErrorCode = "INVALID_SCHEDULE";
    public static string InvalidScheduleMessage => "The schedule information is invalid.";

    public const string InvalidContactErrorCode = "INVALID_CONTACT";
    public static string InvalidContactMessage => "The contact information is invalid.";

    public const string InvalidPricingErrorCode = "INVALID_PRICING";
    public static string InvalidPricingMessage => "The pricing model is invalid.";
  }
}
