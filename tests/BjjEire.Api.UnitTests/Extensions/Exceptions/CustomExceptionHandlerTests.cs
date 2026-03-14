using System.Net;

using BjjEire.Api.Extensions.Exceptions;

namespace BjjEire.Api.UnitTests.Extensions.Exceptions;

[Trait("Category", "Api")]
[Trait("Category", "Unit")]
public sealed class CustomExceptionHandlerTests
{

    [Fact]
    public async Task TryHandleAsync_ValidationException_Returns400()
    {
        var (handler, ctx) = Build();
        var ex = new ValidationException([new ValidationFailure("Name", "Required") { ErrorCode = "NOT_EMPTY" }]);

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task TryHandleAsync_ValidationException_MapsAllErrors()
    {
        var (handler, ctx) = Build();
        var failures = new[]
        {
            new ValidationFailure("Name", "Required") { ErrorCode = "NOT_EMPTY" },
            new ValidationFailure("Email", "Invalid format") { ErrorCode = "EMAIL" }
        };
        var ex = new ValidationException(failures);

        await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task TryHandleAsync_NotFoundException_Returns404()
    {
        var (handler, ctx) = Build();
        var ex = new NotFoundException("Gym", "abc123");

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task TryHandleAsync_ConcurrencyException_Returns409()
    {
        var (handler, ctx) = Build();
        var ex = new ConcurrencyException("Write conflict detected.");

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task TryHandleAsync_UnauthorizedException_WhenUnauthenticated_Returns401()
    {
        var (handler, ctx) = Build(isAuthenticated: false);
        var ex = new UnauthorizedAccessException();

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task TryHandleAsync_UnauthorizedException_WhenAuthenticated_Returns403()
    {
        var (handler, ctx) = Build(isAuthenticated: true);
        var ex = new UnauthorizedAccessException();

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task TryHandleAsync_CustomException_MapsStatusCode()
    {
        var (handler, ctx) = Build();
        var ex = new CustomException("Payment required.", HttpStatusCode.PaymentRequired);

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe((int)HttpStatusCode.PaymentRequired);
    }

    [Fact]
    public async Task TryHandleAsync_UnexpectedException_Returns500()
    {
        var (handler, ctx) = Build(environment: "Production");
        var ex = new InvalidOperationException("Something broke.");

        var result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task TryHandleAsync_NullHttpContext_ThrowsArgumentNullException()
    {
        var (handler, _) = Build();
        await Should.ThrowAsync<ArgumentNullException>(
            async () => await handler.TryHandleAsync(null!, new InvalidOperationException(), CancellationToken.None));
    }

    [Fact]
    public async Task TryHandleAsync_NullException_ThrowsArgumentNullException()
    {
        var (handler, ctx) = Build();
        await Should.ThrowAsync<ArgumentNullException>(
            async () => await handler.TryHandleAsync(ctx, null!, CancellationToken.None));
    }

    private static (CustomExceptionHandler handler, DefaultHttpContext ctx)
        Build(string environment = "Production", bool isAuthenticated = false)
    {
        var logger = new Mock<ILogger<CustomExceptionHandler>>();
        var env = new Mock<IHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns(environment);

        var ctx = new DefaultHttpContext();
        ctx.Response.Body = new MemoryStream();
        ctx.TraceIdentifier = "test-trace";

        if (isAuthenticated)
        {
            ctx.User = new ClaimsPrincipal(
                new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "user-123")], "Bearer"));
        }

        var handler = new CustomExceptionHandler(logger.Object, env.Object);
        return (handler, ctx);
    }
}
