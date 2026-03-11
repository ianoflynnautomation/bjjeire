using AutoMapper;

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.UnitTests.Common.TestBuilders;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Gyms.Commands;

public sealed class CreateGymCommandHandlerTests
{
    private readonly Mock<IGymService> _serviceMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly CreateGymCommandHandler _handler;

    public CreateGymCommandHandlerTests()
    {
        _handler = new CreateGymCommandHandler(_serviceMock.Object, _mapperMock.Object);
    }

    private static GymDto ValidGymDto() => new()
    {
        Id = ObjectIds.Valid1,
        Name = "Dublin BJJ Academy",
        Status = GymStatus.Active,
        County = County.Dublin,
        Location = new Application.Common.DTOs.LocationDto
        {
            Address = "1 Grafton Street, Dublin 2",
            Venue = "Dublin Sports Centre",
            Coordinates = new Application.Common.DTOs.GeoCoordinatesDto
            {
                Type = "Point",
                Latitude = 53.3398,
                Longitude = -6.2603
            }
        },
        SocialMedia = new Application.Common.DTOs.SocialMediaDto(),
        TrialOffer = new TrialOfferDto { IsAvailable = false }
    };

    private static Gym ValidGymEntity() =>
        new() { Id = ObjectIds.Valid1, Name = "Dublin BJJ Academy" };

    [Fact]
    public async Task Handle_ValidCommand_MapsEntityInsertsAndReturnsDto()
    {
        var dto = ValidGymDto();
        var command = new CreateGymCommand { Data = dto };
        var entity = ValidGymEntity();

        _mapperMock
            .Setup(m => m.Map<Gym>(It.IsAny<object>()))
            .Returns(entity);

        _mapperMock
            .Setup(m => m.Map<GymDto>(It.IsAny<object>()))
            .Returns(dto);

        _serviceMock
            .Setup(s => s.InsertAsync(entity))
            .Returns(Task.CompletedTask);

        var response = await _handler.Handle(command, CancellationToken.None);

        response.ShouldNotBeNull();
        response.Data.ShouldBe(dto);

        _serviceMock.Verify(s => s.InsertAsync(entity), Times.Once);
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
        var command = new CreateGymCommand { Data = ValidGymDto() };
        var entity = ValidGymEntity();

        _mapperMock
            .Setup(m => m.Map<Gym>(It.IsAny<object>()))
            .Returns(entity);

        _serviceMock
            .Setup(s => s.InsertAsync(It.IsAny<Gym>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        await Should.ThrowAsync<InvalidOperationException>(
            () => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ValidCommand_NeverCallsGetOrDeleteOrUpdate()
    {
        var command = new CreateGymCommand { Data = ValidGymDto() };
        var entity = ValidGymEntity();

        _mapperMock.Setup(m => m.Map<Gym>(It.IsAny<object>())).Returns(entity);
        _mapperMock.Setup(m => m.Map<GymDto>(It.IsAny<object>())).Returns(ValidGymDto());
        _serviceMock.Setup(s => s.InsertAsync(It.IsAny<Gym>())).Returns(Task.CompletedTask);

        await _handler.Handle(command, CancellationToken.None);

        _serviceMock.Verify(s => s.GetByIdAsync(It.IsAny<string>()), Times.Never);
        _serviceMock.Verify(s => s.DeleteAsync(It.IsAny<Gym>()), Times.Never);
        _serviceMock.Verify(s => s.UpdateAsync(It.IsAny<Gym>()), Times.Never);
    }
}
