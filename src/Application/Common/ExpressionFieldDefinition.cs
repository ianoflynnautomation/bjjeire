using System.Linq.Expressions;

namespace BjjWorld.Application.Common;

public class ExpressionFieldDefinition<TDocument, TField>(LambdaExpression expression, TField value)
{
    public LambdaExpression Expression { get; } = expression;
    public TField Value { get; } = value;
}