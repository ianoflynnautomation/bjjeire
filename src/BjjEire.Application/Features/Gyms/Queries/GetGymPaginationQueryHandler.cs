using BjjEire.Application.Common;
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.Constants;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;
using BjjEire.SharedKernel.Logging;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed class GetGymPaginationQueryHandler(
    IRepository<Gym> gymRepository,
    IMapper mapper,
    ICacheBase cacheBase,
    IUriService uriService,
    ILogger<GetGymPaginationQueryHandler> logger)
    : IRequestHandler<GetGymPaginationQuery, GetGymPaginatedResponse> {
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly IUriService _uriService = uriService;
    private readonly ILogger<GetGymPaginationQueryHandler> _logger = logger;

    public async Task<GetGymPaginatedResponse> Handle(GetGymPaginationQuery request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.GymsAll(request.Page, request.PageSize, request.County);
        var countyLogValue = request.County?.ToString() ?? "N/A";

        _logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Start,
            "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, County: {County}, CacheKey: {CacheKey}",
            nameof(GetGymPaginationQuery),
            request.Page,
            request.PageSize,
            countyLogValue,
            cacheKey);

        var paginatedResponse = await _cacheBase.GetAsync(cacheKey, async () => {
            _logger.LogInformation(
                ApplicationLogEvents.QueryHandling.FetchingFromRepositoryOnCacheMiss,
                "Cache miss for key {CacheKey}. Fetching Gyms from repository. Page: {PageNumber}, PageSize: {PageSize}, County: {County}",
                cacheKey,
                request.Page,
                request.PageSize,
                countyLogValue);

            var query = _gymRepository.Table.Where(x => x.Status == GymStatus.Active);

            if (request.County.HasValue) {
                query = query.Where(x => x.County == request.County.Value);
            }

            query = query.OrderBy(x => x.Name);

            IQueryable<GymDto> dtoQuery = query.ProjectTo<GymDto>(_mapper.ConfigurationProvider);
            var filter = new PaginationFilter(request.Page, request.PageSize);

            var pagedDataFromSource = await PaginationHelper.CreatePagedResponseAsync(
                dtoQuery,
                filter,
                GymsApiConstants.ControllerName,
                GymsApiConstants.GetAllActionName,
                _uriService,
                null,
                cancellationToken);

            _logger.LogInformation(
                ApplicationLogEvents.QueryHandling.DataRetrievedAndPaginatedForCache,
                "Data fetched from repository and paginated for cache key {CacheKey}. Page: {PageNumber}, PageSize: {PageSize}, TotalRecordsFromSource: {TotalRecordsFromSource}, ReturnedCountForPage: {ReturnedCountForPage}",
                cacheKey,
                pagedDataFromSource.Pagination.PageSize,
                pagedDataFromSource.Pagination.PageSize,
                pagedDataFromSource.Pagination.TotalItems,
                pagedDataFromSource.Data.Count);

            return new GetGymPaginatedResponse { Data = pagedDataFromSource.Data, Pagination = pagedDataFromSource.Pagination };
        });

        _logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Success,
            "Successfully handled {QueryName}. Returned {ReturnedCount} gyms for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}",
            nameof(GetGymPaginationQuery),
            paginatedResponse.Data.Count,
            paginatedResponse.Pagination.PageSize,
            paginatedResponse.Pagination.TotalItems,
            cacheKey);

        return paginatedResponse;
    }
}
