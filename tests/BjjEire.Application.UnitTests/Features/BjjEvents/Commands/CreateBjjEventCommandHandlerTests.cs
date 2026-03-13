// Tests for CreateBjjEventCommandHandler.
// Verifies: happy path (service called, response returned),
// null-request guard, and exception propagation.

using AutoMapper;

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Commands;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class CreateBjjEventCommandHandlerTests
{
    private readonly Mock<IBjjEventService> _serviceMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly CreateBjjEventCommandHandler _handler;

    public CreateBjjEventCommandHandlerTests()
    {
        _handler = new CreateBjjEventCommandHandler(_serviceMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_MapsEntityInsertsAndReturnsDto()
    {
        // Arrange
        var command = BjjEventTestData.ValidCreateCommand();
        var entity = BjjEventTestData.ValidEntity();
        var resultDto = BjjEventTestData.ValidDto();

        _mapperMock
            .Setup(m => m.Map<BjjEvent>(It.IsAny<object>()))
            .Returns(entity);

        _mapperMock
            .Setup(m => m.Map<BjjEventDto>(It.IsAny<object>()))
            .Returns(resultDto);

        _serviceMock
            .Setup(s => s.InsertAsync(entity))
            .Returns(Task.CompletedTask);

        // Act
        var response = await _handler.Handle(command, CancellationToken.None);

        // Assert
        response.ShouldNotBeNull();
        response.Data.ShouldBe(resultDto);

        _serviceMock.Verify(s => s.InsertAsync(entity), Times.Once);
        _mapperMock.Verify(m => m.Map<BjjEvent>(command.Data), Times.Once);
        _mapperMock.Verify(m => m.Map<BjjEventDto>(entity), Times.Once);
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        await Should.ThrowAsync<ArgumentNullException>(
            () => _handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ServiceThrows_PropagatesException()
    {
        // Arrange
        var command = BjjEventTestData.ValidCreateCommand();
        var entity = BjjEventTestData.ValidEntity();

        _mapperMock
            .Setup(m => m.Map<BjjEvent>(It.IsAny<object>()))
            .Returns(entity);

        _serviceMock
            .Setup(s => s.InsertAsync(It.IsAny<BjjEvent>()))
            .ThrowsAsync(new InvalidOperationException("DB unavailable"));

        // Act & Assert
        var ex = await Should.ThrowAsync<InvalidOperationException>(
            () => _handler.Handle(command, CancellationToken.None));

        ex.Message.ShouldBe("DB unavailable");
    }

    [Fact]
    public async Task Handle_ValidCommand_DoesNotCallGetOrDelete()
    {
        // Arrange
        var command = BjjEventTestData.ValidCreateCommand();
        var entity = BjjEventTestData.ValidEntity();

        _mapperMock.Setup(m => m.Map<BjjEvent>(It.IsAny<object>())).Returns(entity);
        _mapperMock.Setup(m => m.Map<BjjEventDto>(It.IsAny<object>())).Returns(BjjEventTestData.ValidDto());
        _serviceMock.Setup(s => s.InsertAsync(It.IsAny<BjjEvent>())).Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _serviceMock.Verify(s => s.GetByIdAsync(It.IsAny<string>()), Times.Never);
        _serviceMock.Verify(s => s.DeleteAsync(It.IsAny<BjjEvent>()), Times.Never);
        _serviceMock.Verify(s => s.UpdateAsync(It.IsAny<BjjEvent>()), Times.Never);
    }
}
