
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
            var controllersToRemove = feature.Controllers
                .Where(c => c.IsDefined(typeof(DevelopmentOnlyAttribute), inherit: true))
                .ToList();
            foreach (var controllerTypeInfo in controllersToRemove)
            {
                _ = feature.Controllers.Remove(controllerTypeInfo);
            }
        }
    }
}
