namespace BjjEire.SharedKernel.Attributes;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class | AttributeTargets.Property)]
public sealed class IgnoreApiAttribute : Attribute;

[AttributeUsage(AttributeTargets.Property)]
public sealed class IgnoreApiUrlAttribute : Attribute;
