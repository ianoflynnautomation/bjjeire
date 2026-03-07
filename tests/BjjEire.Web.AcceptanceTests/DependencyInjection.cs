using Autofac;

using BjjEire.Web.AcceptanceTests.StepDefinitions;
using BjjEire.Web.Playwright.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Reqnroll.Autofac;

namespace BjjEire.Web.AcceptanceTests;

public static class DependencyInjection
{

    [ScenarioDependencies]
    public static void CreateServices(Autofac.ContainerBuilder builder)
    {
        RegisterConfiguration(builder);
        RegisterTestOptions(builder);
        RegisterPlaywright(builder);
        RegisterSteps(builder);
    }

    private static void RegisterConfiguration(this Autofac.ContainerBuilder builder)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", false, true)
            .Build();

        _ = builder.RegisterInstance(configuration)
            .As<IConfiguration>()
            .SingleInstance();
    }

    private static void RegisterTestOptions(this Autofac.ContainerBuilder builder)
    {
        _ = builder.Register(c =>
        {
            var configuration = c.Resolve<IConfiguration>();
            var appSettings = new TestOptions();
            configuration.Bind(appSettings);
            return appSettings;
        }).As<TestOptions>().SingleInstance();

        _ = builder.Register(c => new OptionsWrapper<TestOptions>(c.Resolve<TestOptions>()))
            .As<IOptions<TestOptions>>()
            .SingleInstance();
    }

    private static void RegisterPlaywright(this Autofac.ContainerBuilder builder)
    {
        _ = builder.Register(async _ =>
        {
            var playwright = await Microsoft.Playwright.Playwright.CreateAsync().ConfigureAwait(false);
            var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = false,
                SlowMo = 200
            }).ConfigureAwait(false);
            return await browser.NewPageAsync().ConfigureAwait(false);
        }).As<Task<IPage>>().InstancePerDependency();
    }

    private static void RegisterSteps(this Autofac.ContainerBuilder builder) =>
      _ = builder.RegisterType<GymsStepDefinition>().InstancePerDependency();

}
