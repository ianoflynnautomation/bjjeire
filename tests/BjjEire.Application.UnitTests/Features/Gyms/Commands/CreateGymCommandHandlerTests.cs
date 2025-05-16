// using AutoMapper;
// using BjjEire.Application.Common.DTOs;
// using BjjEire.Application.Common.Interfaces;
// using BjjEire.Application.Features.Gyms.Commands;
// using BjjEire.Application.Features.Gyms.DTOs;
// using BjjEire.Domain.Entities.Gyms;
// using BjjEire.Domain.Enums;
// using MongoDB.Bson;
// using Moq;
// using NUnit.Framework;
// using Shouldly;

// namespace BjjEire.Application.UnitTests.Features.Gyms.Commands;

// [TestFixture]
// public class CreateGymCommandHandlerTests {

//     private Mock<IGymService> _gymServiceMock;
//     private Mock<IMapper> _mapperMock;
//     private CreateGymCommandHandler _handler;

//     [SetUp]
//     public void SetUp() {
//         _gymServiceMock = new Mock<IGymService>();
//         _mapperMock = new Mock<IMapper>();
//         _handler = new CreateGymCommandHandler(_gymServiceMock.Object, _mapperMock.Object);
//     }

//     [Test]
//     public void Handle_NullCommand_ThrowsArgumentNullException() {
//         // Arrange
//         CreateGymCommand command = null!;

//         // Act & Assert
//         _ = Should.Throw<ArgumentNullException>(async () => await _handler.Handle(command, CancellationToken.None));
//     }

//     [Test]
//     public async Task Handle_ValidRequest_ShouldCreateGymAndReturnGymDto() {
//         // Arrange
//         //     var gymDto = new GymDto {
//         //     Id = ObjectId.GenerateNewId().ToString(),
//         //     Name = "Test Gym",
//         //     Description = "",
//         //     Status = GymStatus.Active,
//         //     County = "Dublin",
//         //     Affiliation = new AffiliationDto { Name = "Test Affiliation" },
//         //     TrialOffer = new TrialOfferDto { IsAvailable = true },
//         //     Location = new LocationDto { Address = "123 Test St" },
//         //     SocialMedia = new SocialMediaDto(),
//         //     OfferedClasses = [ClassCategory.BJJGiAllLevels],
//         //     Website = "",
//         //     TimetableUrl = "",
//         //     ImageUrl = ""
//         // };

//         var gymDto = new GymDto { Id =ObjectId.GenerateNewId().ToString(), Name = "Test Gym", County = "Test County" };
//         var command = new CreateGymCommand { Model = gymDto };
//         var gymEntity = new Gym { Id = "1", Name = "Test Gym", County = "Test County" };
//         var expectedGymDto = new GymDto { Id = "1", Name = "Test Gym", County = "Test County" };

//         _ = _mapperMock.Setup(m => m.Map<Gym>(gymDto)).Returns(gymEntity);
//         _ = _gymServiceMock.Setup(s => s.Insert(gymEntity)).Returns(Task.CompletedTask);
//         _ = _mapperMock.Setup(m => m.Map<GymDto>(gymEntity)).Returns(expectedGymDto);

//         // Act
//         var result = await _handler.Handle(command, CancellationToken.None);

//         // Assert
//         _ = result.ShouldNotBeNull();
//         result.ShouldBe(expectedGymDto);
//         result.Id.ShouldBe(expectedGymDto.Id);
//         result.Name.ShouldBe(expectedGymDto.Name);

//         _mapperMock.Verify(m => m.Map<Gym>(gymDto), Times.Once);
//         _gymServiceMock.Verify(s => s.Insert(gymEntity), Times.Once);
//         _mapperMock.Verify(m => m.Map<GymDto>(gymEntity), Times.Once);
//     }

//     [Test]
//     public async Task Handle_ValidRequest_ModelIsMappedToEntityCorrectly() {

//             var gymDto = new GymDto
//             {
//                 Name = "Test Gym",
//                 Description = "A test gym",
//                 County = "Test County",
//                 Status = GymStatus.Active,
//                 Location = new LocationDto(),
//                 SocialMedia = new SocialMediaDto(),
//                 TrialOffer = new TrialOfferDto(),
//                 OfferedClasses = [ClassCategory.BJJGiAllLevels],
//                 Website = "https://testgym.com"
//             };
//             var command = new CreateGymCommand { Model = gymDto };
//             var gymEntity = new Gym
//             {
//                 Name = gymDto.Name,
//                 Description = gymDto.Description,
//                 County = gymDto.County,
//                 Status = gymDto.Status
//             };
//             var resultDto = new GymDto
//             {
//                 Id = ObjectId.GenerateNewId().ToString(),
//                 Name = gymDto.Name,
//                 Description = gymDto.Description,
//                 County = gymDto.County,
//                 Status = gymDto.Status
//             };

//         _ = _mapperMock.Setup(m => m.Map<Gym>(gymDto))
//             .Returns(gymEntity);
//         _ = _gymServiceMock.Setup(s => s.Insert(It.IsAny<Gym>()))
//             .Returns(Task.CompletedTask);
//         _ = _mapperMock.Setup(m => m.Map<GymDto>(gymEntity))
//             .Returns(resultDto);

//             // Act
//             var result = await _handler.Handle(command, CancellationToken.None);

//             // Assert
//             result.ShouldBeEquivalentTo(resultDto);
//             _gymServiceMock.Verify(s => s.Insert(It.Is<Gym>(g =>
//                 g.Name == gymDto.Name &&
//                 g.Description == gymDto.Description &&
//                 g.County == gymDto.County &&
//                 g.Status == gymDto.Status
//             )), Times.Once());
//             _mapperMock.Verify(m => m.Map<Gym>(gymDto), Times.Once());
//             _mapperMock.Verify(m => m.Map<GymDto>(gymEntity), Times.Once());
//     }
// }
