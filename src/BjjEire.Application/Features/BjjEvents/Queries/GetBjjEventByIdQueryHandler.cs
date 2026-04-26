// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Caching;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByIdQueryHandler(
    IRepository<BjjEvent> bjjEventRepository,
    IMapper mapper,
    HybridCache hybridCache,
    ILogger<GetBjjEventByIdQueryHandler> logger)
    : IRequestHandler<GetBjjEventByIdQuery, BjjEventDto?>
{
    public async Task<BjjEventDto?> Handle(GetBjjEventByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = BjjEventCacheKeys.ById(request.Id);

        GetBjjEventByIdQueryLog.FetchById(logger, request.Id, cacheKey);

        BjjEventDto? cached = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                BjjEvent? entity = await bjjEventRepository.Table
                    .Where(x => x.Id == request.Id)
                    .FirstOrDefaultAsync(ct);

                if (entity is null)
                {
                    return null;
                }

                return mapper.Map<BjjEventDto>(entity);
            },
            tags: [BjjEventCacheKeys.Tag],
            cancellationToken: cancellationToken);

        return cached;
    }
}
