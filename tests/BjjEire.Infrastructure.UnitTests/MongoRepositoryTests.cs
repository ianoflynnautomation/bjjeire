
namespace BjjEire.Infrastructure.UnitTests;

public sealed class TestEntity : BaseEntity { }

[Trait("Category", "Infrastructure")]
[Trait("Category", "Unit")]
public sealed class MongoRepositoryTests
{

    [Fact]
    public void Constructor_NullDatabase_ThrowsArgumentNullException()
    {
        Func<MongoRepository<TestEntity>> act = () => new MongoRepository<TestEntity>(
            null!,
            new Mock<IAuditInfoProvider>().Object,
            new Mock<ILogger<MongoRepository<TestEntity>>>().Object);

        act.ShouldThrow<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_NullAuditInfoProvider_ThrowsArgumentNullException()
    {
        // Null check for auditInfoProvider fires before GetCollection is called,
        // so the database mock requires no setup.
        Func<MongoRepository<TestEntity>> act = () => new MongoRepository<TestEntity>(
            new Mock<IMongoDatabase>().Object,
            null!,
            new Mock<ILogger<MongoRepository<TestEntity>>>().Object);

        act.ShouldThrow<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Func<MongoRepository<TestEntity>> act = () => new MongoRepository<TestEntity>(
            new Mock<IMongoDatabase>().Object,
            new Mock<IAuditInfoProvider>().Object,
            null!);

        act.ShouldThrow<ArgumentNullException>();
    }


    [Fact]
    public async Task InsertAsync_NullEntity_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.InsertAsync(null!));
    }

    [Fact]
    public async Task UpdateAsync_NullEntity_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.UpdateAsync(null!));
    }

    [Fact]
    public async Task DeleteAsync_NullEntity_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.DeleteAsync((TestEntity)null!));
    }

    [Fact]
    public async Task DeleteAsync_NullEntityCollection_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.DeleteAsync((IEnumerable<TestEntity>)null!));
    }

    [Fact]
    public async Task UpdateOneAsync_NullUpdateBuilder_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.UpdateOneAsync(_ => true, null!));
    }

    [Fact]
    public async Task UpdateManyAsync_NullUpdateBuilder_ThrowsArgumentNullException()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>> _) = BuildRepository();

        await Should.ThrowAsync<ArgumentNullException>(
            () => repo.UpdateManyAsync(_ => true, null!));
    }

    [Fact]
    public async Task DeleteAsync_EmptyEntityCollection_ReturnsWithoutCallingDatabase()
    {
        (MongoRepository<TestEntity>? repo, Mock<IMongoCollection<TestEntity>>? collectionMock) = BuildRepository();

        await repo.DeleteAsync(Enumerable.Empty<TestEntity>());

        collectionMock.Verify(
            c => c.DeleteManyAsync(
                It.IsAny<FilterDefinition<TestEntity>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static (MongoRepository<TestEntity> repo, Mock<IMongoCollection<TestEntity>> collection) BuildRepository()
    {
        Mock<IMongoCollection<TestEntity>> collectionMock = new();

        Mock<IMongoDatabase> dbMock = new();
        dbMock
            .Setup(d => d.GetCollection<TestEntity>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
            .Returns(collectionMock.Object);

        MongoRepository<TestEntity> repo = new(
            dbMock.Object,
            new Mock<IAuditInfoProvider>().Object,
            new Mock<ILogger<MongoRepository<TestEntity>>>().Object);

        return (repo, collectionMock);
    }
}
