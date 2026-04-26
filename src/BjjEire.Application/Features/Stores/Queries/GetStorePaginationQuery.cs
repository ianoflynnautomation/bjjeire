// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Stores.DTOs;

namespace BjjEire.Application.Features.Stores.Queries;

public record GetStorePaginationQuery : BasePaginationQuery, IRequest<PagedResponse<StoreDto>>;
