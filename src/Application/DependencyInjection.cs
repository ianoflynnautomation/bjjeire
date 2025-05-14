using System.Reflection;
using BjjWorld.Application.Common;
using BjjWorld.Application.Common.Behaviours;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Application.Features.BjjEvents.Services;
using BjjWorld.Application.Features.Gyms.DTOs;
using BjjWorld.Application.Features.Gyms.Services;
using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Entities.Gyms;
using Microsoft.Extensions.Hosting;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection
{
    public static IHostApplicationBuilder AddApplicationServices(this IHostApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

        _ = builder.Services.AddMediatR(cfg => {
            _ = cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            _ = cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehaviour<,>));
            _ = cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });

        builder.Services.RegisterOpenMatService();
        builder.Services.RegisterRequestHandler();

        return builder;

    }

    private static void RegisterOpenMatService(this IServiceCollection services)
    {
        _ = services.AddScoped<IBjjEventService, BjjEventService>();
        _ = services.AddScoped<IGymService, GymService>();
    }

    public static void RegisterRequestHandler(this IServiceCollection services)
    {
        var handlerTypes = new (Type dto, Type entity)[]
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
