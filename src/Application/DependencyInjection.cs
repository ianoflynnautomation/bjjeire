using System.Reflection;
using BjjWorld.Application.Common;
using BjjWorld.Application.Common.Behaviours;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Application.Features.GymOpenMats.Services;
using BjjWorld.Domain.Entities.Gyms;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IHostApplicationBuilder AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

        builder.Services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });

        builder.Services.RegisterOpenMatService();
        builder.Services.RegisterRequestHandler();

        return builder;

    }

    private static void RegisterOpenMatService(this IServiceCollection services)
    {
        services.AddScoped<IGymService, GymService>();
    }

    public static void RegisterRequestHandler(this IServiceCollection services)
    {
        var handlerTypes = new (Type dto, Type entity)[]
        {
            (typeof(GymDto), typeof(Gym))
        };

        foreach (var (dto, entity) in handlerTypes)
        {
            var requestHandlerType = typeof(IRequestHandler<,>).MakeGenericType(
                typeof(GetGenericQuery<,>).MakeGenericType(dto, entity),
                typeof(IQueryable<>).MakeGenericType(dto)
            );
            var handlerImplementationType = typeof(GetGenericQueryHandler<,>).MakeGenericType(dto, entity);
            services.AddScoped(requestHandlerType, handlerImplementationType);
        }
    }

}
