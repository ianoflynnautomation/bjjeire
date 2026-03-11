using BjjEire.Application.Common.Behaviours;

using FluentValidation;
using FluentValidation.Results;

using MediatR;

using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Common.Behaviours;

internal sealed record TestRequest(string? Value) : IRequest<TestResponse>;
internal sealed record TestResponse(bool Success);

public sealed class ValidationBehaviourTests
{
    private readonly Mock<ILogger<ValidationBehaviour<TestRequest, TestResponse>>> _loggerMock = new();

    private ValidationBehaviour<TestRequest, TestResponse> BuildBehaviour(
        params IValidator<TestRequest>[] validators) =>
        new(validators, _loggerMock.Object);

    private static RequestHandlerDelegate<TestResponse> NextReturnsSuccess() =>
        _ => Task.FromResult(new TestResponse(true));

    [Fact]
    public async Task Handle_NoValidators_CallsNextAndReturnsResponse()
    {
        var behaviour = BuildBehaviour(/* empty */);
        var nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        var result = await behaviour.Handle(new TestRequest("anything"), next, CancellationToken.None);

        nextCalled.ShouldBeTrue();
        result.Success.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_ValidRequest_CallsNextAndReturnsResponse()
    {
        var validatorMock = new Mock<IValidator<TestRequest>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());   // no failures

        var behaviour = BuildBehaviour(validatorMock.Object);
        var nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        var result = await behaviour.Handle(new TestRequest("valid"), next, CancellationToken.None);

        nextCalled.ShouldBeTrue();
        result.Success.ShouldBeTrue();
    }


    [Fact]
    public async Task Handle_InvalidRequest_ThrowsValidationExceptionAndDoesNotCallNext()
    {
        var failure = new ValidationFailure("Value", "Value is required.") { ErrorCode = "FIELD_REQUIRED" };
        var validatorMock = new Mock<IValidator<TestRequest>>();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure]));

        var behaviour = BuildBehaviour(validatorMock.Object);
        var nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        var ex = await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest(null), next, CancellationToken.None));

        nextCalled.ShouldBeFalse();
        ex.Errors.ShouldNotBeEmpty();
        ex.Errors.ShouldContain(e => e.PropertyName == "Value");
    }

    [Fact]
    public async Task Handle_MultipleValidatorsWithFailures_AggregatesAllErrors()
    {
        var failure1 = new ValidationFailure("Value", "Too short.");
        var failure2 = new ValidationFailure("Value", "Must not contain spaces.");

        var validator1 = new Mock<IValidator<TestRequest>>();
        validator1
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure1]));

        var validator2 = new Mock<IValidator<TestRequest>>();
        validator2
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure2]));

        var behaviour = BuildBehaviour(validator1.Object, validator2.Object);

        var ex = await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest("bad"), NextReturnsSuccess(), CancellationToken.None));

        ex.Errors.Count().ShouldBe(2);
    }

    [Fact]
    public async Task Handle_OneValidatorPassesOneFails_ThrowsValidationException()
    {
        var passing = new Mock<IValidator<TestRequest>>();
        passing
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        var failing = new Mock<IValidator<TestRequest>>();
        failing
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([new ValidationFailure("Value", "Bad value.")]));

        var behaviour = BuildBehaviour(passing.Object, failing.Object);

        await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest("x"), NextReturnsSuccess(), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NullNextDelegate_ThrowsArgumentNullException()
    {
        var behaviour = BuildBehaviour();

        await Should.ThrowAsync<ArgumentNullException>(
            () => behaviour.Handle(new TestRequest("x"), null!, CancellationToken.None));
    }
}
