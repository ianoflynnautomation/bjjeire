namespace BjjEire.Application.Common;

public abstract record BasePaginationQuery
{
    protected const int DefaultPage = 1;
    protected const int DefaultPageSize = 20;
    protected const int MaxPageSize = 100;

    private int _page = DefaultPage;

    public int Page
    {
        get => _page;
        set => _page = (value > 0) ? value : DefaultPage;
    }

    private int _pageSize = DefaultPageSize;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value is > 0 and <= MaxPageSize) ? value : DefaultPageSize;
    }
}
