// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using AutoMapper;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Application.FunctionalTests;

public class FunctionalTestBase : IClassFixture<CustomApiFactory> {
    protected readonly CustomApiFactory _apiFactory;
    protected readonly ITestOutputHelper _testOutputHelper;

    protected FunctionalTestBase(CustomApiFactory apiFactory, ITestOutputHelper testOutputHelper) {
        _apiFactory = apiFactory;
        _testOutputHelper = testOutputHelper;
    }

    protected async Task<T> ExecuteScopeAsync<T>(Func<IServiceProvider, Task<T>> action) {
        using var scope = _apiFactory.Services.CreateScope();
        return await action(scope.ServiceProvider);
    }

    protected Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request) {
        return ExecuteScopeAsync(sp => {
            var mediator = sp.GetRequiredService<IMediator>();
            return mediator.Send(request);
        });
    }

    protected Task<TDto?> FindAsync<TEntity, TDto>(object id)
        where TEntity : BaseEntity
        where TDto : class {
        return ExecuteScopeAsync(async sp => {
            var repository = sp.GetRequiredService<IRepository<TEntity>>();
            var mapper = sp.GetRequiredService<IMapper>();

            var entity = await repository.GetByIdAsync(id.ToString()!);
            return entity == null ? default : mapper.Map<TDto>(entity);
        });
    }
}
