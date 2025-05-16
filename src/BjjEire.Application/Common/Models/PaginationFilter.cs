
namespace BjjEire.Application.Common.Models;

public record PaginationFilter {
    public int PageNumber { get; init; }
    public int PageSize { get; init; }

    public PaginationFilter(int pageNumber = 1, int pageSize = 10) {
        PageNumber = pageNumber < 1 ? 1 : pageNumber;
        PageSize = pageSize <= 0 ? 10 : pageSize > 100 ? 100 : pageSize;
    }
}