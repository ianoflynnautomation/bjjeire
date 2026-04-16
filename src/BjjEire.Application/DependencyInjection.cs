using System.Reflection;

using BjjEire.Application.Common;
using BjjEire.Application.Common.Behaviours;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Services;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Services;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Gyms;

using Microsoft.Extensions.Hosting;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection
{
    public static IHostApplicationBuilder AddApplicationServices(this IHostApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddAutoMapper(cfg => cfg.AddMaps(Assembly.GetExecutingAssembly()));
        _ = builder.Services.AddScoped<IUriService, UriService>();

        _ = builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        _ = builder.Services.AddMediatR(cfg =>
        {
            _ = cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            _ = cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehaviour<,>));
            _ = cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
            _ = cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });

        builder.Services.RegisterService();
        builder.Services.RegisterRequestHandler();

        return builder;
    }

    private static void RegisterService(this IServiceCollection services)
    {
        _ = services.AddScoped<IBjjEventService, BjjEventService>();
        _ = services.AddScoped<IGymService, GymService>();
    }

    public static void RegisterRequestHandler(this IServiceCollection services)
    {
        (Type dto, Type entity)[] handlerTypes = new (Type dto, Type entity)[]
        {
            (typeof(BjjEventDto), typeof(BjjEvent)),
            (typeof(GymDto), typeof(Gym))

        };

        foreach ((Type dto, Type entity) in handlerTypes)
        {
            Type requestHandlerType = typeof(IRequestHandler<,>).MakeGenericType(
                typeof(GetGenericQuery<,>).MakeGenericType(dto, entity),
                typeof(IQueryable<>).MakeGenericType(dto)
            );
            Type handlerImplementationType = typeof(GetGenericQueryHandler<,>).MakeGenericType(dto, entity);
            _ = services.AddScoped(requestHandlerType, handlerImplementationType);
        }
    }

}
