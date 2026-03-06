using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace BjjEire.Api.Extensions.Exceptions;

public class GlobalProducesResponseTypeConvention : IApplicationModelConvention {
    public void Apply(ApplicationModel application) {
        ArgumentNullException.ThrowIfNull(application);

        foreach (var controller in application.Controllers) {
            foreach (var action in controller.Actions) {
                action.Filters.Add(new ProducesResponseTypeAttribute(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest));
                action.Filters.Add(new ProducesResponseTypeAttribute(typeof(ProblemDetails), StatusCodes.Status404NotFound));
                action.Filters.Add(new ProducesResponseTypeAttribute(typeof(ProblemDetails), StatusCodes.Status500InternalServerError));
            }
        }
    }
}
