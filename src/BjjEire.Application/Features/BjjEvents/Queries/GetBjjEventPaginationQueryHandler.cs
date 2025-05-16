using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;
using BjjEire.Application.Features.BjjEvents.Constants;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Common;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(IRepository<BjjEvent> bjjEventRepository, IMapper mapper,
ICacheBase cacheBase, IUriService uriService)
: IRequestHandler<GetBjjEventPaginationQuery, GetBjjEventPaginatedResponse> {
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly IUriService _uriService = uriService;

    public async Task<GetBjjEventPaginatedResponse> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.AllBjjEvents(request.Page, request.PageSize, request.County, request.Type);

        return await _cacheBase.GetAsync(cacheKey, async () => {
            var query = _bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

            if (!string.IsNullOrWhiteSpace(request.County)) {
                query = query.Where(x => x.County.Equals(request.County, StringComparison.CurrentCultureIgnoreCase));
            }

            if (request.Type.HasValue) {
                query = query.Where(x => x.Type == request.Type.Value);
            }

            query = query.OrderBy(x => x.CreatedOnUtc);

            IQueryable<BjjEventDto> dtoQuery = query.ProjectTo<BjjEventDto>(_mapper.ConfigurationProvider);

            var filter = new PaginationFilter(request.Page, request.PageSize);

            var pagedResponse = await PaginationHelper.CreatePagedResponseAsync(dtoQuery, filter, BjjEventsApiConstants.ControllerName, BjjEventsApiConstants.GetAllActionName, _uriService, cancellationToken);

            return new GetBjjEventPaginatedResponse { Data = pagedResponse.Data, Pagination = pagedResponse.Pagination };

        });
    }
}