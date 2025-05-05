namespace BjjWorld.Domain.Entities;

[Serializable]
public class PagedList<T> : List<T>, IPagedList<T>
{
    public int PageIndex { get; protected set; }
    public int PageSize { get; protected set; }
    public int TotalCount { get; protected set; }
    public int TotalPages { get; protected set; }

    public bool HasPreviousPage => PageIndex > 0;
    public bool HasNextPage => PageIndex + 1 < TotalPages;

    public PagedList()
    {
    }

    private PagedList(List<T> items, int count, int pageIndex, int pageSize, int totalPages)
    {
        TotalCount = count;
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalPages = totalPages;

        AddRange(items);
    }

    public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageIndex, int pageSize)
    {
        ArgumentNullException.ThrowIfNull(source);

        if (pageSize <= 0) pageSize = 1;

        int count = await source.CountAsync();
        int totalPages = (count == 0) ? 0 : (int)Math.Ceiling(count / (double)pageSize);
        int currentPageIndex = pageIndex;
        if (totalPages > 0 && currentPageIndex >= totalPages)
        {
            currentPageIndex = totalPages - 1;
        }
        else if (currentPageIndex < 0)
        {
            currentPageIndex = 0;
        }

        var items = new List<T>();
        if (count > 0)
        {
            items = await source.Skip(currentPageIndex * pageSize).Take(pageSize).ToListAsync();
        }

        return new PagedList<T>(items, count, currentPageIndex, pageSize, totalPages);
    }
}