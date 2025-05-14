namespace SharedKernel.Attributes;

[AttributeUsage(AttributeTargets.Property)]
public class DBFieldNameAttribute(string name) : Attribute {
    private readonly string _name = name;

    public virtual string Name => _name;
}