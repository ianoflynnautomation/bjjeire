using System.Linq.Expressions;

namespace BjjWorld.Application.Common;

public class OrderBuilder<T> {
    private readonly List<(Expression<Func<T, object>> selector, bool value, string fieldName)> _list = [];

    protected OrderBuilder() { }

    public IEnumerable<(Expression<Func<T, object>> selector, bool value, string fieldName)> Fields => _list;

    public static OrderBuilder<T> Create() => new();

    public OrderBuilder<T> Ascending(Expression<Func<T, object>> selector) {
        _list.Add((selector, true, ""));

        return this;
    }

    public OrderBuilder<T> Ascending(string fieldName) {
#pragma warning disable CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.
        _list.Add((null, true, fieldName));
#pragma warning restore CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.

        return this;
    }

    public OrderBuilder<T> Descending(Expression<Func<T, object>> selector) {
        _list.Add((selector, false, ""));

        return this;
    }

    public OrderBuilder<T> Descending(string fieldName) {
#pragma warning disable CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.
        _list.Add((null, false, fieldName));
#pragma warning restore CS8620 // Argument cannot be used for parameter due to differences in the nullability of reference types.

        return this;
    }
}