
using System.Linq.Expressions;
using FluentValidation;

namespace BjjWorld.Application.Common.Extensions;

public static class ValidationRuleExtensions
{
    public static IRuleBuilderOptions<T, TProperty> ApplyRequiredValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .NotEmpty()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.Required.Message(fieldName))
            .WithErrorCode(ValidationMessages.Required.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMaxLengthValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, int maxLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MaxLength.Message(fieldName, maxLength))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);
    }

        public static IRuleBuilderOptions<T, string> ApplyMaxLengthValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder,
        string friendlyName,
        int maxLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength) // FluentValidation's MaxLength handles null/empty strings gracefully
            .WithName(friendlyName)
            .WithMessage(ValidationMessages.MaxLength.Message(friendlyName, maxLength)) // Assumes this overload exists
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyRequiredString<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName, int maxLength)
    {
        return ruleBuilder
            .ApplyRequiredValidator(fieldName)
            .ApplyMaxLengthValidator(fieldName, maxLength);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyEnumValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName) where TProperty : Enum
    {
        return ruleBuilder
            .IsInEnum()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidEnum.Message(fieldName))
            .WithErrorCode(ValidationMessages.InvalidEnum.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyUrlValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .Must(url => string.IsNullOrEmpty(url) || ValidationExtension.IsValidUrl(url))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidUrl.Message(fieldName))
            .WithErrorCode(ValidationMessages.InvalidUrl.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyNotNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName) where TProperty : class
    {
        return ruleBuilder
            .NotNull()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NotNull.Message(fieldName))
            .WithErrorCode(ValidationMessages.NotNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TCollection> ApplyNoNullEntriesValidator<T, TCollection, TElement>(
        this IRuleBuilderOptions<T, TCollection> ruleBuilder, string fieldName)
        where TCollection : IEnumerable<TElement?>
    {
        return ruleBuilder
            .Must(collection => collection == null || collection.All(item => item != null))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NoNullEntries.Message(fieldName))
            .WithErrorCode(ValidationMessages.NoNullEntries.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyGreaterThanValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, Expression<Func<T, TProperty>> expression,
        string fieldName, string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThan(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThan.Message(fieldName, comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThan.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, Expression<Func<T, TProperty>> expression,
        string fieldName, string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(fieldName, comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyRegexMatchValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, string regexPattern, string formatDescription)
    {
        return ruleBuilder
            .Matches(regexPattern)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(fieldName, formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyLengthRangeValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, int min, int max)
    {
        return ruleBuilder
            .Length(min, max)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.LengthRange.Message(fieldName, min, max))
            .WithErrorCode(ValidationMessages.LengthRange.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyEmailAddressValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .EmailAddress()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidEmail.Message(fieldName))
            .WithErrorCode(ValidationMessages.InvalidEmail.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyNonNegativeValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName)
        where TProperty : struct, IComparable, IComparable<TProperty>, IEquatable<TProperty>
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(default(TProperty))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NonNegative.Message(fieldName))
            .WithErrorCode(ValidationMessages.NonNegative.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyPositiveOrNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder, string fieldName, string condition)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .Must(val => !val.HasValue || Comparer<TProperty>.Default.Compare(val.Value, default) > 0)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.PositiveOrNull.Message(fieldName, condition))
            .WithErrorCode(ValidationMessages.PositiveOrNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMustBeInSetValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, IEnumerable<string> validSet,
        string formatDescription)
    {
        var localSet = new HashSet<string>(validSet);
        return ruleBuilder
            .Must(item => !string.IsNullOrEmpty(item) && localSet.Contains(item))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(fieldName, formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyMustBeNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName, string condition)
        where TProperty : class
    {
        return ruleBuilder
            .Null()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MustBeNull.Message(fieldName, condition))
            .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyMustBeNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder, string fieldName, string condition)
        where TProperty : struct
    {
        return ruleBuilder
            .Null()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MustBeNull.Message(fieldName, condition))
            .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);
    }
    
        public static IRuleBuilderOptions<T, string> ApplyMustBeEqualValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder,
        string friendlyName,
        string expectedValue)
    {
        return ruleBuilder
            .Must(val => val == expectedValue)
            .WithName(friendlyName)
            .WithMessage(ValidationMessages.MustBeEqualString.Message(expectedValue))
            .WithErrorCode(ValidationMessages.MustBeEqualString.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyInclusiveBetweenValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder,
        string friendlyName,
        TProperty from,
        TProperty to)
        where TProperty : IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .InclusiveBetween(from, to)
            .WithName(friendlyName)
            .WithErrorCode(ValidationMessages.NumericRange.ErrorCode);
    }

}