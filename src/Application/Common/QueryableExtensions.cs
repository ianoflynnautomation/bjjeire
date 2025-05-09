
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common;

public static class QueryableExtensions
{
    public static async Task<IPagedList<TDto>> ToPagedListAsync<TDto>(
        this IQueryable<TDto> source,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await PagedList<TDto>.CreateAsync(source, pageIndex, pageSize, cancellationToken);
    }
}