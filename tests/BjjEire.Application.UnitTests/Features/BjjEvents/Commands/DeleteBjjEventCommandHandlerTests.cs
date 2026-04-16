// Tests for DeleteBjjEventCommandHandler.
// Verifies: happy path (entity found → deleted → IsSuccess true),
// not-found path (NotFoundException), and null-request guard.

using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Domain.Entities.BjjEvents;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Commands;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Unit")]
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
        BjjEvent entity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);
        DeleteBjjEventCommand command = new()
        { Id = ObjectIds.Valid1 };

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .ReturnsAsync(entity);

        _serviceMock
            .Setup(s => s.DeleteAsync(entity))
            .Returns(Task.CompletedTask);

        // Act
        DeleteBjjEventResponse response = await _handler.Handle(command, CancellationToken.None);

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
        DeleteBjjEventCommand command = new()
        { Id = ObjectIds.Valid1 };

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .Returns(Task.FromResult<BjjEvent>(null!));

        // Act & Assert
        NotFoundException ex = await Should.ThrowAsync<NotFoundException>(
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
        BjjEvent entity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);
        DeleteBjjEventCommand command = new()
        { Id = ObjectIds.Valid1 };

        _serviceMock.Setup(s => s.GetByIdAsync(ObjectIds.Valid1)).ReturnsAsync(entity);
        _serviceMock.Setup(s => s.DeleteAsync(It.IsAny<BjjEvent>())).Returns(Task.CompletedTask);

        await _handler.Handle(command, CancellationToken.None);

        _serviceMock.Verify(s => s.InsertAsync(It.IsAny<BjjEvent>()), Times.Never);
        _serviceMock.Verify(s => s.UpdateAsync(It.IsAny<BjjEvent>()), Times.Never);
    }
}
