namespace BjjEire.Domain.Entities;

[Serializable]
public class PagedList<T> : List<T>, IPagedList<T>
{
    public int PageIndex { get; protected set; } // 0-based index

    public int PageSize { get; protected set; }

    public int TotalCount { get; protected set; }

    public int TotalPages { get; protected set; }

    public bool HasPreviousPage => PageIndex > 0;

    public bool HasNextPage => PageIndex + 1 < TotalPages;

    public PagedList() : base()
    {
    }

    public PagedList(List<T> items, int count, int pageIndex, int pageSize) : base(items)
    {
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalCount = count;
        TotalPages = (pageSize > 0 && count > 0) ? (int)Math.Ceiling(count / (double)pageSize) : 0;
    }

}
