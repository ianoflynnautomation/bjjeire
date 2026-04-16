
using System.Linq.Expressions;

namespace BjjEire.Application.Common.Extensions;

public static class ValidationRuleExtensions
{
    public static IRuleBuilderOptions<T, TProperty> ApplyRequiredValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .NotEmpty()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.Required.Message)
            .WithErrorCode(ValidationMessages.Required.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMaxLengthValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder,
        string fieldName,
        int maxLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MaxLength.Message(maxLength))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMaxLengthValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder,
        string fieldName,
        int maxLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MaxLength.Message(maxLength))
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
            .WithMessage(ValidationMessages.Invalid.Message)
            .WithErrorCode(ValidationMessages.Invalid.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyUrlValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .Must(url => string.IsNullOrEmpty(url) || ValidationExtension.IsValidUrl(url))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidUrl.Message)
            .WithErrorCode(ValidationMessages.InvalidUrl.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyNotNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName) where TProperty : class
    {
        return ruleBuilder
            .NotNull()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NotNull.Message)
            .WithErrorCode(ValidationMessages.NotNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TCollection> ApplyNoNullEntriesValidator<T, TCollection, TElement>(
        this IRuleBuilderInitial<T, TCollection> ruleBuilder, string fieldName)
        where TCollection : IEnumerable<TElement?>
        where TElement : class
    {
        return ruleBuilder
            .Must(collection => object.Equals(collection, default(TCollection)) || collection.All(item => item != null))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NoNullEntries.Message)
            .WithErrorCode(ValidationMessages.NoNullEntries.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TCollection> ApplyNoNullEntriesValidatorForValueTypes<T, TCollection, TElement>(
        this IRuleBuilderInitial<T, TCollection> ruleBuilder, string fieldName)
        where TCollection : IEnumerable<TElement?>
        where TElement : struct
    {
        return ruleBuilder
            .Must(collection => object.Equals(collection, default(TCollection)) || collection.All(item => item != null))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NoNullEntries.Message)
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
            .WithMessage(ValidationMessages.GreaterThan.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThan.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder, Expression<Func<T, TProperty?>> expression,
        string fieldName, string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThan(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThan.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThan.ErrorCode);
    }
    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanValidator<T, TProperty>(
       this IRuleBuilderInitial<T, TProperty?> ruleBuilder, Expression<Func<T, TProperty>> expression,
       string fieldName, string comparedToFieldName)
       where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThan(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThan.Message(comparedToFieldName))
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
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder,
        Expression<Func<T, TProperty>> expression,
        string fieldName,
        string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder,
        Expression<Func<T, TProperty?>> expression,
        string fieldName,
        string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty> ruleBuilder, Expression<Func<T, TProperty>> expression,
        string fieldName, string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty?> ruleBuilder,
        Expression<Func<T, TProperty>> expression,
        string fieldName,
        string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyGreaterThanOrEqualValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty?> ruleBuilder,
        Expression<Func<T, TProperty?>> expression,
        string fieldName,
        string comparedToFieldName)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(expression)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.GreaterThanOrEqual.Message(comparedToFieldName))
            .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyRegexMatchValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, string regexPattern, string formatDescription)
    {
        return ruleBuilder
            .Matches(regexPattern)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }
    public static IRuleBuilderOptions<T, string> ApplyRegexMatchValidator<T>(
       this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName, string regexPattern, string formatDescription)
    {
        return ruleBuilder
            .Matches(regexPattern)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }


    public static IRuleBuilderOptions<T, string> ApplyLengthRangeValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, int min, int max)
    {
        return ruleBuilder
            .Length(min, max)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.LengthRange.Message(min, max))
            .WithErrorCode(ValidationMessages.LengthRange.ErrorCode);
    }
    public static IRuleBuilderOptions<T, string> ApplyLengthRangeValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName, int min, int max)
    {
        return ruleBuilder
            .Length(min, max)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.LengthRange.Message(min, max))
            .WithErrorCode(ValidationMessages.LengthRange.ErrorCode);
    }


    public static IRuleBuilderOptions<T, string> ApplyEmailAddressValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName)
    {
        return ruleBuilder
            .EmailAddress()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidEmail.Message)
            .WithErrorCode(ValidationMessages.InvalidEmail.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyNonNegativeValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName)
        where TProperty : struct, IComparable, IComparable<TProperty>, IEquatable<TProperty>
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(default(TProperty))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.NonNegative.Message)
            .WithErrorCode(ValidationMessages.NonNegative.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyPositiveOrNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder,
        string fieldName,
        string conditionDescription)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .Must(value => !value.HasValue || Comparer<TProperty>.Default.Compare(value.Value, default) > 0)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.PositiveOrNull.Message(conditionDescription))
            .WithErrorCode(ValidationMessages.PositiveOrNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyPositiveOrNullValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty?> ruleBuilder,
        string fieldName,
        string conditionDescription)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .Must(value => !value.HasValue || Comparer<TProperty>.Default.Compare(value.Value, default) > 0)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.PositiveOrNull.Message(conditionDescription))
            .WithErrorCode(ValidationMessages.PositiveOrNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMustBeInSetValidator<T>(
        this IRuleBuilderOptions<T, string> ruleBuilder, string fieldName, IEnumerable<string> validSet,
        string formatDescription)
    {
        HashSet<string> localSet = new(validSet);
        return ruleBuilder
            .Must(item => string.IsNullOrEmpty(item) || localSet.Contains(item))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }
    public static IRuleBuilderOptions<T, string> ApplyMustBeInSetValidator<T>(
       this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName, IEnumerable<string> validSet,
       string formatDescription)
    {
        HashSet<string> localSet = new(validSet);
        return ruleBuilder
            .Must(item => string.IsNullOrEmpty(item) || localSet.Contains(item))
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InvalidFormat.Message(formatDescription))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode);
    }


    public static IRuleBuilderOptions<T, TProperty> ApplyMustBeNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName, string condition)
        where TProperty : class
    {
        return ruleBuilder
            .Null()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MustBeNull.Message(condition))
            .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyMustBeNullValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder, string fieldName, string condition)
        where TProperty : struct
    {
        return ruleBuilder
            .Null()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MustBeNull.Message(condition))
            .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);
    }

    public static IRuleBuilderOptions<T, string> ApplyMustBeEqualValidator<T>(
        this IRuleBuilderInitial<T, string> ruleBuilder, string fieldName, string expectedValue)
    {
        return ruleBuilder
            .Must(val => val == expectedValue)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.MustBeEqualString.Message(expectedValue))
            .WithErrorCode(ValidationMessages.MustBeEqualString.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyInclusiveBetweenValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty?> ruleBuilder,
        string fieldName,
        TProperty from,
        TProperty to)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .InclusiveBetween(from, to)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InclusiveBetweenValue.Message(from, to))
            .WithErrorCode(ValidationMessages.InclusiveBetweenValue.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty?> ApplyInclusiveBetweenValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty?> ruleBuilder,
        string fieldName,
        TProperty from,
        TProperty to)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .InclusiveBetween(from, to)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InclusiveBetweenValue.Message(from, to))
            .WithErrorCode(ValidationMessages.InclusiveBetweenValue.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyInclusiveBetweenValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder,
        string fieldName,
        TProperty from,
        TProperty to)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .InclusiveBetween(from, to)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InclusiveBetweenValue.Message(from, to))
            .WithErrorCode(ValidationMessages.InclusiveBetweenValue.ErrorCode);
    }

    public static IRuleBuilderOptions<T, TProperty> ApplyInclusiveBetweenValidator<T, TProperty>(
        this IRuleBuilderOptions<T, TProperty> ruleBuilder,
        string fieldName,
        TProperty from,
        TProperty to)
        where TProperty : struct, IComparable<TProperty>, IComparable
    {
        return ruleBuilder
            .InclusiveBetween(from, to)
            .WithName(fieldName)
            .WithMessage(ValidationMessages.InclusiveBetweenValue.Message(from, to))
            .WithErrorCode(ValidationMessages.InclusiveBetweenValue.ErrorCode);
    }


    public static IRuleBuilderOptions<T, TProperty> ApplyConditionalRequiredValidator<T, TProperty>(
        this IRuleBuilderInitial<T, TProperty> ruleBuilder, string fieldName, string condition)
    {
        return ruleBuilder
            .NotNull()
            .WithName(fieldName)
            .WithMessage(ValidationMessages.ConditionalRequired.Message(fieldName, condition))
            .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);
    }
}
