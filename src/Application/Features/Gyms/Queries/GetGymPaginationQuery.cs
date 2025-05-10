
namespace BjjWorld.Application.Features.Gyms.Queries;

public record GetGymPaginationQuery : IRequest<GetGymPaginatedResponse>
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;

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
        set => _pageSize = (value > 0 && value <= MaxPageSize) ? value : DefaultPageSize;
    }

    public string? City { get; set; }
}