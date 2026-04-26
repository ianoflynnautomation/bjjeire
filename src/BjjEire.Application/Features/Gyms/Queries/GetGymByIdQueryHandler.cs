// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.Caching;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed class GetGymByIdQueryHandler(
    IRepository<Gym> gymRepository,
    IMapper mapper,
    HybridCache hybridCache,
    ILogger<GetGymByIdQueryHandler> logger)
    : IRequestHandler<GetGymByIdQuery, GymDto?>
{
    public async Task<GymDto?> Handle(GetGymByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = GymCacheKeys.ById(request.Id);

        GetGymByIdQueryLog.FetchById(logger, request.Id, cacheKey);

        GymDto? cached = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                Gym? entity = await gymRepository.Table
                    .Where(x => x.Id == request.Id)
                    .FirstOrDefaultAsync(ct);

                if (entity is null)
                {
                    return null;
                }

                return mapper.Map<GymDto>(entity);
            },
            tags: [GymCacheKeys.Tag],
            cancellationToken: cancellationToken);

        return cached;
    }
}
