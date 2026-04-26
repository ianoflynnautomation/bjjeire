// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

namespace BjjEire.Application.Common;

public class OrderBuilder<T>
{
    private readonly List<(Expression<Func<T, object>>? selector, bool value, string fieldName)> _list = [];

    protected OrderBuilder() { }

    public IEnumerable<(Expression<Func<T, object>>? selector, bool value, string fieldName)> Fields => _list;

#pragma warning disable CA1000 // Static factory on generic type is the intended fluent-builder API
    public static OrderBuilder<T> Create() => new();
#pragma warning restore CA1000

    public OrderBuilder<T> Ascending(Expression<Func<T, object>> selector)
    {
        _list.Add((selector, true, ""));
        return this;
    }

    public OrderBuilder<T> Ascending(string fieldName)
    {
        _list.Add((null, true, fieldName));
        return this;
    }

    public OrderBuilder<T> Descending(Expression<Func<T, object>> selector)
    {
        _list.Add((selector, false, ""));
        return this;
    }

    public OrderBuilder<T> Descending(string fieldName)
    {
        _list.Add((null, false, fieldName));
        return this;
    }
}
