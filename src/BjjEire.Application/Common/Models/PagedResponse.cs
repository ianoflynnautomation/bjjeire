
using BjjEire.Application.Common.DTOs;

namespace BjjEire.Application.Common.Models;

public record PagedResponse<T>
{
    public List<T> Data { get; init; } = [];
    public PaginationMetadataDto Pagination { get; init; } = new();
}
