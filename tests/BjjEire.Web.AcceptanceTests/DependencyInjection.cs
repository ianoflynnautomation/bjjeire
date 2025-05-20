using Autofac;
using Reqnroll.Autofac;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using BjjEire.Web.Playwright.Core.Configuration;
using Microsoft.Playwright;

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
        RegisterPages(builder);
    }

    private static void RegisterConfiguration(this Autofac.ContainerBuilder builder)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", false, true)
            .Build();

        builder.RegisterInstance(configuration)
            .As<IConfiguration>()
            .SingleInstance();
    }

    private static void RegisterTestOptions(this ContainerBuilder builder)
    {
        builder.Register(c =>
        {
            var configuration = c.Resolve<IConfiguration>();
            var appSettings = new TestOptions();
            configuration.Bind(appSettings);
            return appSettings;
        }).As<TestOptions>().SingleInstance();

        builder.Register(c => new OptionsWrapper<TestOptions>(c.Resolve<TestOptions>()))
            .As<IOptions<TestOptions>>()
            .SingleInstance();
    }

    private static void RegisterPlaywright(this Autofac.ContainerBuilder builder)
    {
        builder.Register(async _ =>
        {
            var playwright = await Playwright.CreateAsync().ConfigureAwait(false);
            var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = false,
                SlowMo = 200
            }).ConfigureAwait(false);
            return await browser.NewPageAsync().ConfigureAwait(false);
        }).As<Task<IPage>>().InstancePerDependency();
    }

    private static void RegisterSteps(this Autofac.ContainerBuilder builder)
    {
        //builder.RegisterType<StepDefinitions>().InstancePerDependency();
    }

    private static void RegisterPages(this Autofac.ContainerBuilder builder)
    {
        // builder.RegisterType<HomePage>().AsSelf().InstancePerDependency();
        // builder.RegisterType<SupportPage>().AsSelf().InstancePerDependency();
    }


}
