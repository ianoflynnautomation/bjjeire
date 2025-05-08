
using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Entities;
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(IRepository<BjjEvent> bjjEventRepository, IMapper mapper,
    ICacheBase cacheBase, ILinkService linkService)
    : IRequestHandler<GetBjjEventPaginationQuery, PaginatedBjjEventResponseDto>
{
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly ILinkService _linkService = linkService;
    private const string ControllerName = "GetAll";
    private const string ActionName = "GetAllBjjEvents";

    public async Task<PaginatedBjjEventResponseDto> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken)
    {
        var key = string.Format(CacheKey.BJJ_EVENT_ALL, request.Page, request.PageSize, request.City, request.Type);
        return await _cacheBase.GetAsync(key, async () =>
        {
            var query = from p in _bjjEventRepository.Table
                        select p;

            query = query.Where(x => x.IsActive == true);

            if (!string.IsNullOrEmpty(request.City))
            {
                query = query.Where(x => x.City.Equals(request.City, StringComparison.CurrentCultureIgnoreCase));
            }

            if (request.Type.HasValue)
            {
                query = query.Where(x => x.Type == request.Type.Value);
            }

            var resultDto = query.ProjectTo<BjjEventDto>(_mapper.ConfigurationProvider);
            var pagedList = await PagedList<BjjEventDto>.CreateAsync(resultDto, request.Page - 1, request.PageSize);


            var (nextPageUrl, previousPageUrl) = _linkService.GeneratePaginationUrls(
                controllerName: ControllerName,
                actionName: ActionName,
                currentPage: request.Page,
                pageSize: request.PageSize,
                totalPages: pagedList.TotalPages,
                hasNextPage: pagedList.HasNextPage,
                hasPreviousPage: pagedList.HasPreviousPage
            );

            return new PaginatedBjjEventResponseDto
            {
                Data = [.. pagedList],
                Pagination = new PaginationMetadataDto
                {
                    TotalItems = pagedList.TotalCount,
                    CurrentPage = request.Page,
                    PageSize = pagedList.PageSize,
                    TotalPages = pagedList.TotalPages,
                    HasNextPage = pagedList.HasNextPage,
                    HasPreviousPage = pagedList.HasPreviousPage,
                    NextPageUrl = nextPageUrl,
                    PreviousPageUrl = previousPageUrl

                }
            };
        });
    }
}
