// Copyright (c) {year} BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

namespace BjjEire.Application.Common;

public class ExpressionFieldDefinition<TDocument, TField>(LambdaExpression expression, TField value) {
    public LambdaExpression Expression { get; } = expression;
    public TField Value { get; } = value;
}
