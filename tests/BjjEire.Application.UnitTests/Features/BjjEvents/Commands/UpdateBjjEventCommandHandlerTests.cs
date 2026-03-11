using AutoMapper;

using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.UnitTests.Common.TestBuilders;
using BjjEire.Domain.Entities.BjjEvents;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Commands;

public sealed class UpdateBjjEventCommandHandlerTests
{
    private readonly Mock<IBjjEventService> _serviceMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly UpdateBjjEventCommandHandler _handler;

    public UpdateBjjEventCommandHandlerTests()
    {
        _handler = new UpdateBjjEventCommandHandler(_serviceMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task Handle_EntityFound_MapsUpdateAndReturnsDto()
    {
        // Arrange
        var dto = BjjEventTestData.ValidDto(ObjectIds.Valid1);
        var command = new UpdateBjjEventCommand { Data = dto };
        var existingEntity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);
        var resultDto = BjjEventTestData.ValidDto(ObjectIds.Valid1);

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .ReturnsAsync(existingEntity);

        _mapperMock
            .Setup(m => m.Map(It.IsAny<BjjEventDto>(), It.IsAny<BjjEvent>()))
            .Returns(existingEntity);

        _serviceMock
            .Setup(s => s.UpdateAsync(existingEntity))
            .Returns(Task.CompletedTask);

        _mapperMock
            .Setup(m => m.Map<BjjEventDto>(It.IsAny<object>()))
            .Returns(resultDto);

        // Act
        var response = await _handler.Handle(command, CancellationToken.None);

        // Assert
        response.ShouldNotBeNull();
        response.Data.ShouldBe(resultDto);

        _serviceMock.Verify(s => s.GetByIdAsync(ObjectIds.Valid1), Times.Once);
        _serviceMock.Verify(s => s.UpdateAsync(existingEntity), Times.Once);
    }

    [Fact]
    public async Task Handle_EntityNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var command = new UpdateBjjEventCommand { Data = BjjEventTestData.ValidDto(ObjectIds.Valid1) };

        _serviceMock
            .Setup(s => s.GetByIdAsync(ObjectIds.Valid1))
            .ReturnsAsync((BjjEvent?)null);

        // Act & Assert
        var ex = await Should.ThrowAsync<NotFoundException>(
            () => _handler.Handle(command, CancellationToken.None));

        ex.Message.ShouldContain(ObjectIds.Valid1);
        _serviceMock.Verify(s => s.UpdateAsync(It.IsAny<BjjEvent>()), Times.Never);
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        await Should.ThrowAsync<ArgumentNullException>(
            () => _handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_EntityFound_NeverCallsInsertOrDelete()
    {
        var dto = BjjEventTestData.ValidDto(ObjectIds.Valid1);
        var command = new UpdateBjjEventCommand { Data = dto };
        var entity = BjjEventTestData.ValidEntity(ObjectIds.Valid1);

        _serviceMock.Setup(s => s.GetByIdAsync(ObjectIds.Valid1)).ReturnsAsync(entity);
        _mapperMock.Setup(m => m.Map(It.IsAny<BjjEventDto>(), It.IsAny<BjjEvent>())).Returns(entity);
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<BjjEvent>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map<BjjEventDto>(It.IsAny<object>())).Returns(dto);

        await _handler.Handle(command, CancellationToken.None);

        _serviceMock.Verify(s => s.InsertAsync(It.IsAny<BjjEvent>()), Times.Never);
        _serviceMock.Verify(s => s.DeleteAsync(It.IsAny<BjjEvent>()), Times.Never);
    }
}
