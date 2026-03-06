// using BjjEire.Application.Common.Constants;
// using BjjEire.Application.Common.Interfaces;
// using BjjEire.Application.Features.Gyms.Services;
// using BjjEire.Domain.Entities.Gyms;
// using Moq;
// using NUnit.Framework;
// using Shouldly;

// namespace BjjEire.Application.UnitTests.Features.Gyms.Services;

// [TestFixture]
// public class GymServiceTests
// {
//     private Mock<IRepository<Gym>> _mockGymRepository;
//     private Mock<ICacheBase> _mockCacheBase;
//     private GymService _gymService;

//     [SetUp]
//     public void SetUp()
//     {
//         _mockGymRepository = new Mock<IRepository<Gym>>();
//         _mockCacheBase = new Mock<ICacheBase>();
//         _gymService = new GymService(_mockGymRepository.Object, _mockCacheBase.Object);
//     }

//     #region GetById Tests
//     [Test]
//     public void GetById_NullId_ShouldThrowArgumentNullException()
//     {
//         // Arrange
//         string id = null;

//         // Act & Assert
//         _ = Should.Throw<ArgumentNullException>(async () => await _gymService.GetById(id));
//     }

//     [Test]
//     public async Task GetById_CacheHit_ReturnsGymFromCache()
//     {
//         // Arrange
//         var gymId = "gym1";
//         var cachedGym = new Gym { Id = gymId, Name = "Cached Gym" };
//         var cacheKey = string.Format(CacheKey.GYM_BY_ID_KEY, gymId);

//         _ = _mockCacheBase.Setup(c => c.GetAsync(cacheKey, It.IsAny<Func<Task<Gym>>>()))
//                       .ReturnsAsync(cachedGym);

//         // Act
//         var result = await _gymService.GetById(gymId);

//         // Assert
//         result.ShouldBe(cachedGym);
//         _mockGymRepository.Verify(r => r.GetByIdAsync(gymId), Times.Never);
//     }

//     [Test]
//     public async Task GetById_CacheMiss_FetchesGymFromRepositoryAndCachesIt()
//     {
//         // Arrange
//         var gymId = "gym1";
//         var repoGym = new Gym { Id = gymId, Name = "Repo Gym" };
//         var cacheKey = string.Format(CacheKey.GYM_BY_ID_KEY, gymId);

//         _ = _mockCacheBase.Setup(c => c.GetAsync(cacheKey, It.IsAny<Func<Task<Gym>>>()))
//                       .Returns<string, Func<Task<Gym>>>(async (key, factory) => {
//                           // Simulate repository call within the factory
//                           _ = _mockGymRepository.Setup(r => r.GetByIdAsync(gymId)).ReturnsAsync(repoGym);
//                           return await factory();
//                       });


//         // Act
//         var result = await _gymService.GetById(gymId);

//         // Assert
//         result.ShouldBe(repoGym);
//         _mockGymRepository.Verify(r => r.GetByIdAsync(gymId), Times.Once); // Called by the factory
//                                                                            // Verify it was "cached" (i.e., factory was called by GetAsync)
//         _mockCacheBase.Verify(c => c.GetAsync(cacheKey, It.IsAny<Func<Task<Gym>>>()), Times.Once);
//     }
//     #endregion

//     #region Insert Tests
//     [Test]
//     public void Insert_NullGym_ShouldThrowArgumentNullException()
//     {
//         // Arrange
//         Gym gym = null;

//         // Act & Assert
//         _ = Should.Throw<ArgumentNullException>(async () => await _gymService.Insert(gym));
//     }

//     [Test]
//     public async Task Insert_ValidGym_ShouldCallRepositoryInsertAndRemoveCacheByPrefix()
//     {
//         // Arrange
//         var gym = new Gym { Name = "New Gym" };
//         _ = _mockGymRepository.Setup(r => r.InsertAsync(gym)).ReturnsAsync(gym); // Assuming InsertAsync returns the entity

//         // Act
//         await _gymService.Insert(gym);

//         // Assert
//         _mockGymRepository.Verify(r => r.InsertAsync(gym), Times.Once);
//         _mockCacheBase.Verify(c => c.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY), Times.Once);
//     }
//     #endregion

//     #region Update Tests
//     [Test]
//     public void Update_NullGym_ShouldThrowArgumentNullException()
//     {
//         // Arrange
//         Gym gym = null;

//         // Act & Assert
//         _ = Should.Throw<ArgumentNullException>(async () => await _gymService.Update(gym));
//     }

//     [Test]
//     public async Task Update_ValidGym_ShouldCallRepositoryUpdateAndRemoveCacheByPrefix()
//     {
//         // Arrange
//         var gym = new Gym { Id = "gym1", Name = "Updated Gym" };
//         _mockGymRepository.Setup(r => r.UpdateAsync(gym)).ReturnsAsync(1); // Assuming UpdateAsync returns records affected

//         // Act
//         await _gymService.Update(gym);

//         // Assert
//         _mockGymRepository.Verify(r => r.UpdateAsync(gym), Times.Once);
//         _mockCacheBase.Verify(c => c.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY), Times.Once);
//     }
//     #endregion

//     #region Delete Tests
//     [Test]
//     public void Delete_NullGym_ShouldThrowArgumentNullException()
//     {
//         // Arrange
//         Gym gym = null;

//         // Act & Assert
//         _ = Should.Throw<ArgumentNullException>(async () => await _gymService.Delete(gym));
//     }

//     [Test]
//     public async Task Delete_ValidGym_ShouldCallRepositoryDeleteAndRemoveCacheByPrefixFirst()
//     {
//         // Arrange
//         var gym = new Gym { Id = "gym1", Name = "Gym To Delete" };
//         _mockGymRepository.Setup(r => r.DeleteAsync(gym)).ReturnsAsync(1); // Assuming DeleteAsync returns records affected

//         var sequence = new MockSequence();
//         _ = _mockCacheBase.InSequence(sequence).Setup(c => c.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY)).Returns(Task.CompletedTask);
//         _mockGymRepository.InSequence(sequence).Setup(r => r.DeleteAsync(gym)).ReturnsAsync(1);


//         // Act
//         await _gymService.Delete(gym);

//         // Assert
//         _mockCacheBase.Verify(c => c.RemoveByPrefix(CacheKey.GYM_PATTERN_KEY), Times.Once);
//         _mockGymRepository.Verify(r => r.DeleteAsync(gym), Times.Once);
//     }
//     #endregion

//     #region GetAll Tests
//     [Test]
//     public void GetAll_ShouldThrowNotImplementedException()
//     {
//         // Act & Assert
//         _ = Should.Throw<NotImplementedException>(() => _gymService.GetAll());
//     }
//     #endregion
// }
