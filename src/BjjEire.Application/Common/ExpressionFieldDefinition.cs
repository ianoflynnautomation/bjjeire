// Copyright (c) {year} BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

namespace BjjEire.Application.Common;

#pragma warning disable S2326
public class ExpressionFieldDefinition<TDocument, TField>(LambdaExpression expression, TField value)
{
    public LambdaExpression Expression { get; } = expression;
    public TField Value { get; } = value;
}
#pragma warning restore S2326
