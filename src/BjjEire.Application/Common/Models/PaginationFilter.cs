
namespace BjjEire.Application.Common.Models;

public record PaginationFilter
{
    public int PageNumber { get; init; }
    public int PageSize { get; init; }

    public PaginationFilter(int pageNumber = 1, int pageSize = 10)
    {
        PageNumber = Math.Max(1, pageNumber);
        PageSize = Math.Clamp(pageSize, 1, 100);
    }
}

