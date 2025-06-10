using BjjEire.Application.Common;
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.Constants;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;
using BjjEire.SharedKernel.Logging;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(
    IRepository<BjjEvent> bjjEventRepository,
    IMapper mapper,
    ICacheBase cacheBase,
    IUriService uriService,
    ILogger<GetBjjEventByPaginationQueryHandler> logger)
    : IRequestHandler<GetBjjEventPaginationQuery, GetBjjEventPaginatedResponse> {
    private readonly IRepository<BjjEvent> _bjjEventRepository = bjjEventRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly IUriService _uriService = uriService;
    private readonly ILogger<GetBjjEventByPaginationQueryHandler> _logger = logger;

    public async Task<GetBjjEventPaginatedResponse> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.BjjEventsAll(request.Page, request.PageSize, request.County, request.Type);

        _logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Start,
            "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, County: {County}, Type: {EventType}, CacheKey: {CacheKey}",
            nameof(GetBjjEventPaginationQuery),
            request.Page,
            request.PageSize,
            request.County?.ToString() ?? "N/A",
            request.Type?.ToString() ?? "N/A",
            cacheKey);

        var paginatedResponse = await _cacheBase.GetAsync(cacheKey, async () => {
            _logger.LogInformation(
                    ApplicationLogEvents.QueryHandling.FetchingFromRepositoryOnCacheMiss,
                    "Cache miss for key {CacheKey}. Fetching BJJ events from repository with filters - Page: {PageNumber}, PageSize: {PageSize}, County: {County}, Type: {EventType}",
                    cacheKey,
                    request.Page,
                    request.PageSize,
                    request.County?.ToString() ?? "N/A",
                    request.Type?.ToString() ?? "N/A");

            var query = _bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

            if (request.County.HasValue) {
                query = query.Where(x => x.County == request.County.Value);
            }

            if (request.Type.HasValue) {
                query = query.Where(x => x.Type == request.Type.Value);
            }

            query = query.OrderBy(x => x.CreatedOnUtc);

            IQueryable<BjjEventDto> dtoQuery = query.ProjectTo<BjjEventDto>(_mapper.ConfigurationProvider);

            var filter = new PaginationFilter(request.Page, request.PageSize);

            var pagedDataFromSource = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery,
                    filter,
                    BjjEventsApiConstants.ControllerName,
                    BjjEventsApiConstants.GetAllActionName,
                    _uriService,
                    null,
                    cancellationToken);

            _logger.LogInformation(
                    ApplicationLogEvents.QueryHandling.DataRetrievedAndPaginatedForCache,
                    "Data fetched from repository and paginated for cache key {CacheKey}. Page: {PageNumber}, PageSize: {PageSize}, TotalRecordsFromSource: {TotalRecordsFromSource}, ReturnedCountForPage: {ReturnedCountForPage}",
                    cacheKey,
                    pagedDataFromSource.Pagination.CurrentPage,
                    pagedDataFromSource.Pagination.PageSize,
                    pagedDataFromSource.Pagination.TotalItems,
                    pagedDataFromSource.Data.Count);

            return new GetBjjEventPaginatedResponse { Data = pagedDataFromSource.Data, Pagination = pagedDataFromSource.Pagination };
        });

        _logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Success,
            "Successfully handled {QueryName}. Returned {ReturnedCount} items for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}",
            nameof(GetBjjEventPaginationQuery),
            paginatedResponse.Data.Count,
            paginatedResponse.Pagination.CurrentPage,
            paginatedResponse.Pagination.TotalItems,
            cacheKey);

        return paginatedResponse;
    }
}
