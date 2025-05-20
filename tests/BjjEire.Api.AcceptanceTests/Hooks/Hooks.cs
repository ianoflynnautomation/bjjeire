
using Reqnroll;

[Binding]
public class MyHooks
{

    [BeforeTestRun()]
    public void BeforeTestRun()
    {
    }

    [BeforeFeature()]
    public async Task BeforeFeature()
    {

    }

    [BeforeScenario()]
    public async Task BeforeScenario()
    {
    }


    [BeforeStep()]
    public async Task BeforeStep()
    {

    }

    [AfterStep()]
    public async Task AfterStep()
    {

    }

    [AfterScenario()]
    public async Task AfterScenario()
    {
    }

    [AfterFeature()]
    public async Task AfterFeature()
    {

    }

    [AfterTestRun]
    public async Task AfterTestRun()
    {

    }


}
