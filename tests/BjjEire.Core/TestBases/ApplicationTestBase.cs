// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using AutoMapper;

using BjjEire.Application.Common.Interfaces;
using BjjEire.Core.Factories;
using BjjEire.Core.Interfaces;
using BjjEire.Domain.Entities;

using MediatR;

using Microsoft.Extensions.DependencyInjection;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Core.TestBases;

public class ApplicationTestBase : IAsyncLifetime
{
    private readonly IServiceScope _scope;
    protected readonly ITestOutputHelper _testOutputHelper;
    protected ITestDatabaseService Database { get; }

    protected ApplicationTestBase(CustomApiFactory apiFactory, ITestOutputHelper testOutputHelper)
    {
        _testOutputHelper = testOutputHelper;
        _scope = apiFactory.Services.CreateScope();
        Database = _scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
    }

    public virtual async Task InitializeAsync() => await Database.ClearCollectionsAsync().ConfigureAwait(false);

    public virtual Task DisposeAsync()
    {
        _scope.Dispose();
        return Task.CompletedTask;
    }

    protected Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request)
    {
        IMediator mediator = _scope.ServiceProvider.GetRequiredService<IMediator>();
        return mediator.Send(request);
    }

    protected async Task<TDto?> FindAsync<TEntity, TDto>(object id)
        where TEntity : BaseEntity
        where TDto : class
    {
        IRepository<TEntity> repository = _scope.ServiceProvider.GetRequiredService<IRepository<TEntity>>();
        IMapper mapper = _scope.ServiceProvider.GetRequiredService<IMapper>();

        TEntity entity = await repository.GetByIdAsync(id.ToString()!).ConfigureAwait(false);
        return entity == null ? default : mapper.Map<TDto>(entity);
    }
}
