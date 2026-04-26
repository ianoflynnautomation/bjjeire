// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.Common;

public abstract record BasePaginationQuery
{
    protected const int DefaultPage = 1;
    protected const int DefaultPageSize = 20;
    protected const int MaxPageSize = 100;

    public int Page
    {
        get;
        set => field = (value > 0) ? value : DefaultPage;
    } = DefaultPage;

    public int PageSize
    {
        get;
        set => field = (value is > 0 and <= MaxPageSize) ? value : DefaultPageSize;
    } = DefaultPageSize;
}
