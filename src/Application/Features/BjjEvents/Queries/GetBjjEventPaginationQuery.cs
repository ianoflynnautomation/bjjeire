
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Queries;

public record GetBjjEventPaginationQuery : IRequest<GetBjjEventPaginatedResponseDto> {
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;

    private int _page = DefaultPage;
    public int Page {
        get => _page;
        set => _page = (value > 0) ? value : DefaultPage;
    }

    private int _pageSize = DefaultPageSize;
    public int PageSize {
        get => _pageSize;
        set => _pageSize = (value is > 0 and <= MaxPageSize) ? value : DefaultPageSize;
    }

    public string? County { get; set; }
    public BjjEventType? Type { get; set; }
}