// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace BjjEire.Api.Extensions.Exceptions;

public class GlobalProducesResponseTypeConvention : IApplicationModelConvention {
    public void Apply(ApplicationModel application) {
        ArgumentNullException.ThrowIfNull(application);

        foreach (var controller in application.Controllers) {
            controller.Actions.Select(action => action.Filters).ToList().ForEach(filters => {
                filters.Add(new ProducesResponseTypeAttribute(
                    typeof(ValidationProblemDetails),
                    StatusCodes.Status400BadRequest));
                filters.Add(new ProducesResponseTypeAttribute(
                    typeof(ProblemDetails),
                    StatusCodes.Status404NotFound));
                filters.Add(new ProducesResponseTypeAttribute(
                    typeof(ProblemDetails),
                    StatusCodes.Status500InternalServerError));
            });
        }
    }
}