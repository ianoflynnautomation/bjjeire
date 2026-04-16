using BjjEire.Application.Common.Behaviours;

using FluentValidation;
using FluentValidation.Results;

using MediatR;

using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Common.Behaviours;

public sealed record TestRequest(string? Value) : IRequest<TestResponse>;
public sealed record TestResponse(bool Success);

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
        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour(/* empty */);
        bool nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        TestResponse result = await behaviour.Handle(new TestRequest("anything"), next, CancellationToken.None);

        nextCalled.ShouldBeTrue();
        result.Success.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_ValidRequest_CallsNextAndReturnsResponse()
    {
        Mock<IValidator<TestRequest>> validatorMock = new();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());   // no failures

        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour(validatorMock.Object);
        bool nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        TestResponse result = await behaviour.Handle(new TestRequest("valid"), next, CancellationToken.None);

        nextCalled.ShouldBeTrue();
        result.Success.ShouldBeTrue();
    }


    [Fact]
    public async Task Handle_InvalidRequest_ThrowsValidationExceptionAndDoesNotCallNext()
    {
        ValidationFailure failure = new("Value", "Value is required.") { ErrorCode = "FIELD_REQUIRED" };
        Mock<IValidator<TestRequest>> validatorMock = new();
        validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure]));

        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour(validatorMock.Object);
        bool nextCalled = false;
        RequestHandlerDelegate<TestResponse> next = _ =>
        {
            nextCalled = true;
            return Task.FromResult(new TestResponse(true));
        };

        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest(null), next, CancellationToken.None));

        nextCalled.ShouldBeFalse();
        ex.Errors.ShouldNotBeEmpty();
        ex.Errors.ShouldContain(e => e.PropertyName == "Value");
    }

    [Fact]
    public async Task Handle_MultipleValidatorsWithFailures_AggregatesAllErrors()
    {
        ValidationFailure failure1 = new("Value", "Too short.");
        ValidationFailure failure2 = new("Value", "Must not contain spaces.");

        Mock<IValidator<TestRequest>> validator1 = new();
        validator1
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure1]));

        Mock<IValidator<TestRequest>> validator2 = new();
        validator2
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure2]));

        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour(validator1.Object, validator2.Object);

        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest("bad"), NextReturnsSuccess(), CancellationToken.None));

        ex.Errors.Count().ShouldBe(2);
    }

    [Fact]
    public async Task Handle_OneValidatorPassesOneFails_ThrowsValidationException()
    {
        Mock<IValidator<TestRequest>> passing = new();
        passing
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        Mock<IValidator<TestRequest>> failing = new();
        failing
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<TestRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([new ValidationFailure("Value", "Bad value.")]));

        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour(passing.Object, failing.Object);

        await Should.ThrowAsync<ValidationException>(
            () => behaviour.Handle(new TestRequest("x"), NextReturnsSuccess(), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NullNextDelegate_ThrowsArgumentNullException()
    {
        ValidationBehaviour<TestRequest, TestResponse> behaviour = BuildBehaviour();

        await Should.ThrowAsync<ArgumentNullException>(
            () => behaviour.Handle(new TestRequest("x"), null!, CancellationToken.None));
    }
}
