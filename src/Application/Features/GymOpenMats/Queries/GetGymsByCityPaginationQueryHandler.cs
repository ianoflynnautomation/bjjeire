
using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Domain.Entities;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public sealed class GetGymsByCityPaginationQueryHandler(IRepository<Gym> gymRepository, IMapper mapper,
    ICacheBase cacheBase, ILinkService linkService)
    : IRequestHandler<GetGymsByCityPaginationQuery, PaginatedGymResponseDto>
{
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly ILinkService _linkService = linkService;
    private const string ControllerName = "Gym";
    private const string ActionName = "GetByCity";

    public async Task<PaginatedGymResponseDto> Handle(GetGymsByCityPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNullOrEmpty(request.City);

        var key = string.Format(CacheKey.GYMS_ALL_BY_CITY, request.City, request.Page, request.PageSize);
        return await _cacheBase.GetAsync(key, async () =>
        {
            var query = from p in _gymRepository.Table
                        select p;

            if (!string.IsNullOrEmpty(request.City))
                query = query.Where(x => x.Address.City == request.City);

                query = query.Where(x => x.IsActive == true);

            var resultDto = query.ProjectTo<GymDto>(_mapper.ConfigurationProvider);
            var pagedList = await PagedList<GymDto>.CreateAsync(resultDto, request.Page - 1, request.PageSize);


            var (nextPageUrl, previousPageUrl) = _linkService.GeneratePaginationUrls(
                controllerName: ControllerName,
                actionName: ActionName,
                currentPage: request.Page,
                pageSize: request.PageSize,
                totalPages: pagedList.TotalPages,
                hasNextPage: pagedList.HasNextPage,
                hasPreviousPage: pagedList.HasPreviousPage
            );

            return new PaginatedGymResponseDto
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
