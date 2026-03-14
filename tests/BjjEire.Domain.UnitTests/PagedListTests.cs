namespace BjjEire.Domain.UnitTests;

[Trait("Category", "Domain")]
[Trait("Category", "Unit")]
public sealed class PagedListTests
{
    [Fact]
    public void Constructor_SetsPageIndex()
    {
        var sut = Build(count: 10, pageIndex: 2, pageSize: 3);
        sut.PageIndex.ShouldBe(2);
    }

    [Fact]
    public void Constructor_SetsPageSize()
    {
        var sut = Build(count: 10, pageIndex: 0, pageSize: 5);
        sut.PageSize.ShouldBe(5);
    }

    [Fact]
    public void Constructor_SetsTotalCount()
    {
        var sut = Build(count: 42, pageIndex: 0, pageSize: 10);
        sut.TotalCount.ShouldBe(42);
    }

    [Fact]
    public void Constructor_ContainsSuppliedItems()
    {
        var items = new List<int> { 1, 2, 3 };
        var sut = new PagedList<int>(items, count: 3, pageIndex: 0, pageSize: 10);
        sut.ShouldBe(items);
    }

    [Theory]
    [InlineData(10, 3, 4)]   // ceil(10/3) = 4
    [InlineData(9, 3, 3)]    // exact division
    [InlineData(1, 10, 1)]   // fewer items than page size
    [InlineData(100, 25, 4)] // exact division, larger numbers
    public void Constructor_CalculatesTotalPages(int count, int pageSize, int expectedPages)
    {
        var sut = Build(count, pageIndex: 0, pageSize);
        sut.TotalPages.ShouldBe(expectedPages);
    }

    [Fact]
    public void Constructor_WithZeroCount_SetsTotalPagesToZero()
    {
        var sut = Build(count: 0, pageIndex: 0, pageSize: 10);
        sut.TotalPages.ShouldBe(0);
    }

    [Fact]
    public void Constructor_WithZeroPageSize_SetsTotalPagesToZero()
    {
        var sut = Build(count: 10, pageIndex: 0, pageSize: 0);
        sut.TotalPages.ShouldBe(0);
    }

    [Fact]
    public void HasPreviousPage_WhenPageIndexIsZero_ReturnsFalse()
    {
        var sut = Build(count: 20, pageIndex: 0, pageSize: 10);
        sut.HasPreviousPage.ShouldBeFalse();
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void HasPreviousPage_WhenPageIndexIsGreaterThanZero_ReturnsTrue(int pageIndex)
    {
        var sut = Build(count: 100, pageIndex, pageSize: 10);
        sut.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public void HasNextPage_WhenOnLastPage_ReturnsFalse()
    {
        // 10 items, pageSize 5 → 2 pages (index 0 and 1). On page index 1 = last.
        var sut = Build(count: 10, pageIndex: 1, pageSize: 5);
        sut.HasNextPage.ShouldBeFalse();
    }

    [Fact]
    public void HasNextPage_WhenNotOnLastPage_ReturnsTrue()
    {
        // 10 items, pageSize 5 → 2 pages. On page index 0 → next exists.
        var sut = Build(count: 10, pageIndex: 0, pageSize: 5);
        sut.HasNextPage.ShouldBeTrue();
    }


    [Fact]
    public void DefaultConstructor_CreatesEmptyList()
    {
        var sut = new PagedList<string>();
        sut.ShouldBeEmpty();
        sut.TotalPages.ShouldBe(0);
        sut.TotalCount.ShouldBe(0);
    }

    private static PagedList<int> Build(int count, int pageIndex, int pageSize)
    {
        var items = Enumerable.Range(1, Math.Min(count, pageSize > 0 ? pageSize : count)).ToList();
        return new PagedList<int>(items, count, pageIndex, pageSize);
    }
}

