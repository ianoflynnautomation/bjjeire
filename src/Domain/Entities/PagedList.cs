namespace BjjWorld.Domain.Entities;


[Serializable]
public class PagedList<T> : List<T>, IPagedList<T> {
    public int PageIndex { get; protected set; } // 0-based index
    public int PageSize { get; protected set; }
    public int TotalCount { get; protected set; }
    public int TotalPages { get; protected set; }

    public bool HasPreviousPage => PageIndex > 0;
    public bool HasNextPage => PageIndex + 1 < TotalPages;

    public PagedList() : base() {
    }

    private PagedList(List<T> items, int count, int pageIndex, int pageSize) : base(items) {
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalCount = count;
        TotalPages = (pageSize > 0 && count > 0) ? (int)Math.Ceiling(count / (double)pageSize) : 0;
    }

    public static async Task<IPagedList<T>> CreateAsync(IQueryable<T> source, int pageIndex, int pageSize, CancellationToken cancellationToken = default) {
        ArgumentNullException.ThrowIfNull(source);

        if (pageSize <= 0) {
            pageSize = 10; // Default page size, consider making this configurable
        }

        if (pageIndex < 0) {
            pageIndex = 0; // Ensure page index is not negative
        }

        int count = await source.CountAsync(cancellationToken);

        var items = new List<T>();
        if (count > 0) {
            items = await source.Skip(pageIndex * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        }

        return new PagedList<T>(items, count, pageIndex, pageSize);
    }
}