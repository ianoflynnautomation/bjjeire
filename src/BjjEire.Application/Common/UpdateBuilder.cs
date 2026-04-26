// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

using MongoDB.Driver;

namespace BjjEire.Application.Common;

public class UpdateBuilder<T>
{
    private readonly List<ExpressionFieldDefinition<T, object>> _expressionFieldDefinitions = [];
    private readonly List<UpdateDefinition<T>> _list = [];

    protected UpdateBuilder() { }

    public IEnumerable<UpdateDefinition<T>> Fields => _list;

    public IEnumerable<ExpressionFieldDefinition<T, object>> ExpressionFields => _expressionFieldDefinitions;

#pragma warning disable CA1000 // Static factory on generic type is the intended fluent-builder API
    public static UpdateBuilder<T> Create() => new();
#pragma warning restore CA1000

    public UpdateBuilder<T> Set<TProperty>(Expression<Func<T, TProperty>> selector, TProperty value)
    {
        _list.Add(Builders<T>.Update.Set(selector, value));

        _expressionFieldDefinitions.Add(new ExpressionFieldDefinition<T, object>(selector, value!));

        return this;
    }
}
