using Microsoft.Playwright;

namespace BjjEire.Web.Playwright.Core.PageObjects;

public class WebPage(IPage page) {
    private IPage Page { get; } = page;

    protected IPageAssertions Expect() => Assertions.Expect(Page);

    protected static ILocatorAssertions Expect(ILocator locator) => Assertions.Expect(locator);
}
