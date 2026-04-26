// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using SerilogExtensions = BjjEire.Api.Extensions.Logging.Serilog.Extensions;

namespace BjjEire.Api.UnitTests.Extensions.Logging;

[Trait("Category", "Api")]
[Trait("Category", "Unit")]
public sealed class SerilogExtensionsTests
{
    private static readonly MethodInfo GetRequestLogLevel =
        typeof(SerilogExtensions).GetMethod(
            "GetRequestLogLevel",
            BindingFlags.NonPublic | BindingFlags.Static)!;

    [Fact]
    public void GetRequestLogLevel_WhenExceptionPresent_ReturnsError()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 200);
        Invoke(ctx, ex: new InvalidOperationException("boom")).ShouldBe(LogEventLevel.Error);
    }

    [Fact]
    public void GetRequestLogLevel_When5xxStatusCode_ReturnsError()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 500);
        Invoke(ctx).ShouldBe(LogEventLevel.Error);
    }

    [Fact]
    public void GetRequestLogLevel_When503StatusCode_ReturnsError()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 503);
        Invoke(ctx).ShouldBe(LogEventLevel.Error);
    }

    [Fact]
    public void GetRequestLogLevel_When4xxStatusCode_ReturnsWarning()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 400);
        Invoke(ctx).ShouldBe(LogEventLevel.Warning);
    }

    [Fact]
    public void GetRequestLogLevel_When404StatusCode_ReturnsWarning()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 404);
        Invoke(ctx).ShouldBe(LogEventLevel.Warning);
    }

    [Fact]
    public void GetRequestLogLevel_WhenHealthCheckSuccess_ReturnsVerbose()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 200, path: "/health");
        Invoke(ctx).ShouldBe(LogEventLevel.Verbose);
    }

    [Fact]
    public void GetRequestLogLevel_WhenHealthCheckSuccessUpperCase_ReturnsVerbose()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 200, path: "/HEALTH");
        Invoke(ctx).ShouldBe(LogEventLevel.Verbose);
    }

    [Fact]
    public void GetRequestLogLevel_WhenHealthCheckReturns4xx_ReturnsWarningNotVerbose()
    {
        // Health path but non-success status → Warning (not Verbose)
        DefaultHttpContext ctx = ContextWith(statusCode: 503, path: "/health");
        Invoke(ctx).ShouldBe(LogEventLevel.Error);
    }

    [Fact]
    public void GetRequestLogLevel_WhenNormalRequest_ReturnsInformation()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 200, path: "/api/gyms");
        Invoke(ctx).ShouldBe(LogEventLevel.Information);
    }

    [Fact]
    public void GetRequestLogLevel_When201Created_ReturnsInformation()
    {
        DefaultHttpContext ctx = ContextWith(statusCode: 201, path: "/api/gyms");
        Invoke(ctx).ShouldBe(LogEventLevel.Information);
    }

    private static LogEventLevel Invoke(HttpContext ctx, double elapsed = 0, Exception? ex = null) =>
        (LogEventLevel)GetRequestLogLevel.Invoke(null, [ctx, elapsed, ex])!;

    private static DefaultHttpContext ContextWith(int statusCode, string path = "/api/test")
    {
        DefaultHttpContext ctx = new();
        ctx.Response.StatusCode = statusCode;
        ctx.Request.Path = path;
        return ctx;
    }
}
