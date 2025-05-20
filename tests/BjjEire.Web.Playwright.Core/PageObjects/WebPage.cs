using Microsoft.Playwright;

namespace BjjEire.Web.Playwright.Core;

public class WebPage(IPage _page)
{
    protected IPage Page { get; } = _page;

    protected IPageAssertions Expect()
    {
        return Assertions.Expect(Page);
    }

    protected ILocatorAssertions Expect(ILocator locator)
    {
        return Assertions.Expect(locator);
    }

}