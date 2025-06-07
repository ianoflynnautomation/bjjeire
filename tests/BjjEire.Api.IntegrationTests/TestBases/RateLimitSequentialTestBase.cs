// // Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// // Licensed under the MIT License.
//
// using BjjEire.Api.IntegrationTests.Common;
// using BjjEire.Api.IntegrationTests.Fixtures;
// using BjjEire.Api.IntegrationTests.Services;
// using DotNet.Testcontainers.Builders;
// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Logging;
// using Testcontainers.MongoDb;
// using Xunit;
// using Xunit.Abstractions;
//
// namespace BjjEire.Api.IntegrationTests.TestBases;
//
// [Collection("Sequential")]
// public abstract class RateLimitSequentialIntegrationTestBase(ITestOutputHelper output) :  IAsyncLifetime
// {
//     private MongoDbContainer _dbContainer = null!;
//     private RateLimitTestApiFactory _factory = null!;
//     protected readonly ITestOutputHelper Output = output;
//
//     protected ITestDatabaseService DatabaseService = null!;
//     protected ITestHttpClientService HttpService = null!;
//
//     public async Task InitializeAsync()
//     {
//         Logger = SerilogConfiguration.ConfigureTestLogger(output);
//
//         _dbContainer = new MongoDbBuilder()
//             .WithImage("mongo:7.0")
//             .WithUsername("testUserMongo")
//             .WithPassword("testPassMongo")
//             .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
//             .Build();
//         await _dbContainer.StartAsync();
//
//         _factory = new RateLimitTestApiFactory(_dbContainer.GetConnectionString(), Logger);
//         HttpClient = _factory.CreateClient();
//
//         var scope = _factory.Services.CreateScope();
//         DatabaseService = scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
//         HttpService = new TestHttpClientService(HttpClient);
//
//         BeginTestScope(Output);
//     }
//
//     public async Task DisposeAsync()
//     {
//         EndTestScope();
//         HttpClient?.Dispose();
//         await _dbContainer.StopAsync();
//         await _factory.DisposeAsync();
//     }
// }
