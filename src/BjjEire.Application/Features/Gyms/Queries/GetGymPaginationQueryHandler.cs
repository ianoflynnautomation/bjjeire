using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Enums;
using BjjEire.Application.Features.Gyms.Constants;
using BjjEire.Application.Common.Models;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed class GetGymPaginationQueryHandler(IRepository<Gym> gymRepository, IMapper mapper,
ICacheBase cacheBase, IUriService uriService)
: IRequestHandler<GetGymPaginationQuery, GetGymPaginatedResponse> {
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly IUriService _uriService = uriService;

    public async Task<GetGymPaginatedResponse> Handle(GetGymPaginationQuery request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.GymsAll(request.Page, request.PageSize, request.County);

        return await _cacheBase.GetAsync(cacheKey, async () => {

            var query = _gymRepository.Table.Where(x => x.Status == GymStatus.Active);

            if (!string.IsNullOrWhiteSpace(request.County)) {
                query = query.Where(x => x.County.Equals(request.County, StringComparison.CurrentCultureIgnoreCase));
            }

            query = query.OrderBy(x => x.Name);

            IQueryable<GymDto> dtoQuery = query.ProjectTo<GymDto>(_mapper.ConfigurationProvider);

            var filter = new PaginationFilter(request.Page, request.PageSize);

            var pagedResponse = await PaginationHelper.CreatePagedResponseAsync(dtoQuery, filter, GymsApiConstants.ControllerName, GymsApiConstants.GetAllActionName, _uriService, null, cancellationToken);

            return new GetGymPaginatedResponse { Data = pagedResponse.Data, Pagination = pagedResponse.Pagination };

        });
    }
}