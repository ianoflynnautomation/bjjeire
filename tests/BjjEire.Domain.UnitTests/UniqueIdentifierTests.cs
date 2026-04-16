namespace BjjEire.Domain.UnitTests;

[Trait("Category", "Domain")]
[Trait("Category", "Unit")]
public sealed class UniqueIdentifierTests
{
    [Fact]
    public void New_ReturnsNonEmptyString()
    {
        UniqueIdentifier.New.ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public void New_Returns24CharacterString()
    {
        UniqueIdentifier.New.Length.ShouldBe(24);
    }

    [Fact]
    public void New_ReturnsValidHexString()
    {
        string id = UniqueIdentifier.New;
        id.ShouldAllBe(c => "0123456789abcdef".Contains(c));
    }

    [Fact]
    public void New_ReturnsUniqueValueOnEachCall()
    {
        List<string> ids = Enumerable.Range(0, 100).Select(_ => UniqueIdentifier.New).ToList();
        ids.Distinct().Count().ShouldBe(ids.Count);
    }
}
