using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Application.Common;
using Microsoft.AspNetCore.Routing;
using BjjEire.Application.Common.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(IRepository<BjjEvent> bjjEventRepository, IMapper mapper,
ICacheBase cacheBase, ILinkService linkService)
: IRequestHandler<GetBjjEventPaginationQuery, GetBjjEventPaginatedResponseDto> {
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly ILinkService _linkService = linkService;
    private const string ControllerNameForLinks = "GetAllBjjEvents";
    private const string ActionNameForLinks = "GetAll";

    public async Task<GetBjjEventPaginatedResponseDto> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var cacheKey = string.Format(CacheKey.BJJ_EVENT_ALL, request.Page, request.PageSize, request.County, request.Type);

        return await _cacheBase.GetAsync(cacheKey, async () => {
            var query = _bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

            if (!string.IsNullOrWhiteSpace(request.County)) {
                query = query.Where(x => x.County.Equals(request.County, StringComparison.CurrentCultureIgnoreCase));
            }

            if (request.Type.HasValue) {
                query = query.Where(x => x.Type == request.Type.Value);
            }

            query = query.OrderBy(x => x.CreatedOnUtc);

            var pagedBjjEventDtos = await query
                .ProjectTo<BjjEventDto>(_mapper.ConfigurationProvider)
                .ToPagedListAsync(request.Page - 1, request.PageSize, cancellationToken);

            var additionalRouteValues = new RouteValueDictionary();
            if (!string.IsNullOrWhiteSpace(request.County)) {
                additionalRouteValues["county"] = request.County;
            }
            if (request.Type.HasValue) {
                additionalRouteValues["type"] = request.Type.Value.ToString();
            }

            var (nextPageUrl, previousPageUrl) = _linkService.GeneratePaginationUrls(
                controllerName: ControllerNameForLinks,
                actionName: ActionNameForLinks,
                currentPage: request.Page,
                pageSize: pagedBjjEventDtos.PageSize,
                totalPages: pagedBjjEventDtos.TotalPages,
                hasNextPage: pagedBjjEventDtos.HasNextPage,
                hasPreviousPage: pagedBjjEventDtos.HasPreviousPage,
                additionalRouteValues: additionalRouteValues
            );

            return new GetBjjEventPaginatedResponseDto {
                Data = [.. pagedBjjEventDtos],
                Pagination = new PaginationMetadataDto {
                    TotalItems = pagedBjjEventDtos.TotalCount,
                    CurrentPage = request.Page,
                    PageSize = pagedBjjEventDtos.PageSize,
                    TotalPages = pagedBjjEventDtos.TotalPages,
                    HasNextPage = pagedBjjEventDtos.HasNextPage,
                    HasPreviousPage = pagedBjjEventDtos.HasPreviousPage,
                    NextPageUrl = nextPageUrl,
                    PreviousPageUrl = previousPageUrl
                }
            };

        });
    }
}