
using BjjEire.Api.Attributes;


namespace BjjEire.Api.Infrastructure;

public class DevelopmentOnlyControllerFeatureProvider(IWebHostEnvironment environment) : IApplicationFeatureProvider<ControllerFeature>
{
    private readonly IWebHostEnvironment _environment = environment;

    public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
    {
        ArgumentNullException.ThrowIfNull(parts);
        ArgumentNullException.ThrowIfNull(feature);

        if (!_environment.IsDevelopment())
        {
            var controllersToRemove = new List<TypeInfo>();
            foreach (var controllerTypeInfo in feature.Controllers.ToList())
            {
                if (controllerTypeInfo.IsDefined(typeof(DevelopmentOnlyAttribute), inherit: true))
                {
                    controllersToRemove.Add(controllerTypeInfo);
                }
            }
            foreach (var controllerTypeInfo in controllersToRemove)
            {
                _ = feature.Controllers.Remove(controllerTypeInfo);
            }
        }
    }
}