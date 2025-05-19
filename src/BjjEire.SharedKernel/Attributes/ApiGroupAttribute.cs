namespace BjjEire.SharedKernel.Attributes;


[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class ApiGroupAttribute(string groupName) : Attribute
{
    public string GroupName { get; } = groupName;
}