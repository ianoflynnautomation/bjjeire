using System.Linq.Expressions;

namespace BjjEire.Application.Common;

public class ExpressionFieldDefinition<TDocument, TField>(LambdaExpression expression, TField value)
{
    public LambdaExpression Expression { get; } = expression;
    public TField Value { get; } = value;
}