namespace BjjEire.Application.IntegrationTests;

// xUnit requires the class name end in "Collection" — suppress the analyser warning.
#pragma warning disable CA1711
[CollectionDefinition(Name)]
public class AppIntegrationCollection : ICollectionFixture<CustomApiFactory>
#pragma warning restore CA1711
{
    public const string Name = "AppIntegration";
}
