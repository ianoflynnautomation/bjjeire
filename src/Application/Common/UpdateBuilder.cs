
using System.Linq.Expressions;
using MongoDB.Driver;

namespace BjjEire.Application.Common;

public class UpdateBuilder<T> {
    private readonly List<ExpressionFieldDefinition<T, object>> _expressionFieldDefinitions = [];
    private readonly List<UpdateDefinition<T>> _list = [];

    protected UpdateBuilder() { }

    public IEnumerable<UpdateDefinition<T>> Fields => _list;

    public IEnumerable<ExpressionFieldDefinition<T, object>> ExpressionFields => _expressionFieldDefinitions;

    public static UpdateBuilder<T> Create() => new();

    public UpdateBuilder<T> Set<TProperty>(Expression<Func<T, TProperty>> selector, TProperty value) {
        //for mongodb
        _list.Add(Builders<T>.Update.Set(selector, value));

        //for other Db
#pragma warning disable CS8604 // Possible null reference argument.
        _expressionFieldDefinitions.Add(new ExpressionFieldDefinition<T, object>(selector, value));
#pragma warning restore CS8604 // Possible null reference argument.

        return this;
    }
}