// Tests for DeleteBjjEventCommandHandler.
// Verifies: happy path (entity found → deleted → IsSuccess true),
// not-found path (NotFoundException), and null-request guard.

using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.UnitTests.Common.TestBuilders;
using BjjEire.Domain.Entities.BjjEvents;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Commands;

public sealed class DeleteBjjEventCommandHandlerTests
{
    private readonly Mock<IBjjEventService> _serviceMock = new();
    private readonly DeleteBjjEventCommandHandler _handler;

    public DeleteBjjEventCommandHandlerTests()
    {
        _handler = new DeleteBjjEventCommandHandler(_serviceMock.Object);
    }

    [Fact]
    public async Task Handle_EntityFound_DeletesEntityAndReturnsSuccess()
    {
        // Arrange
        var entity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);
        var command = new DeleteBjjEventCommand { Id = ObjectIds.Valid1 };

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .ReturnsAsync(entity);

        _serviceMock
            .Setup(s => s.DeleteAsync(entity))
            .Returns(Task.CompletedTask);

        // Act
        var response = await _handler.Handle(command, CancellationToken.None);

        // Assert
        response.ShouldNotBeNull();
        response.IsSuccess.ShouldBeTrue();

        _serviceMock.Verify(s => s.GetByIdAsync(ObjectIds.Valid1), Times.Once);
        _serviceMock.Verify(s => s.DeleteAsync(entity), Times.Once);
    }

    [Fact]
    public async Task Handle_EntityNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var command = new DeleteBjjEventCommand { Id = ObjectIds.Valid1 };

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .ReturnsAsync(default(BjjEvent));

        // Act & Assert
        var ex = await Should.ThrowAsync<NotFoundException>(
            () => _handler.Handle(command, CancellationToken.None));

        ex.Message.ShouldContain(ObjectIds.Valid1);
        _serviceMock.Verify(s => s.DeleteAsync(It.IsAny<BjjEvent>()), Times.Never);
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        await Should.ThrowAsync<ArgumentNullException>(
            () => _handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_EntityFound_NeverCallsInsertOrUpdate()
    {
        var entity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);
        var command = new DeleteBjjEventCommand { Id = ObjectIds.Valid1 };

        _serviceMock.Setup(s => s.GetByIdAsync(ObjectIds.Valid1)).ReturnsAsync(entity);
        _serviceMock.Setup(s => s.DeleteAsync(It.IsAny<BjjEvent>())).Returns(Task.CompletedTask);

        await _handler.Handle(command, CancellationToken.None);

        _serviceMock.Verify(s => s.InsertAsync(It.IsAny<BjjEvent>()), Times.Never);
        _serviceMock.Verify(s => s.UpdateAsync(It.IsAny<BjjEvent>()), Times.Never);
    }
}
