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
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        ValidationException ex = new([new ValidationFailure("Name", "Required") { ErrorCode = "NOT_EMPTY" }]);

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task TryHandleAsync_ValidationException_MapsAllErrors()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        ValidationFailure[] failures = new[]
        {
            new ValidationFailure("Name", "Required") { ErrorCode = "NOT_EMPTY" },
            new ValidationFailure("Email", "Invalid format") { ErrorCode = "EMAIL" }
        };
        ValidationException ex = new(failures);

        await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task TryHandleAsync_NotFoundException_Returns404()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        NotFoundException ex = new("Gym", "abc123");

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task TryHandleAsync_ConcurrencyException_Returns409()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        ConcurrencyException ex = new("Write conflict detected.");

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task TryHandleAsync_UnauthorizedException_WhenUnauthenticated_Returns401()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build(isAuthenticated: false);
        UnauthorizedAccessException ex = new();

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task TryHandleAsync_UnauthorizedException_WhenAuthenticated_Returns403()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build(isAuthenticated: true);
        UnauthorizedAccessException ex = new();

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task TryHandleAsync_CustomException_MapsStatusCode()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        CustomException ex = new("Payment required.", HttpStatusCode.PaymentRequired);

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe((int)HttpStatusCode.PaymentRequired);
    }

    [Fact]
    public async Task TryHandleAsync_UnexpectedException_Returns500()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build(environment: "Production");
        InvalidOperationException ex = new("Something broke.");

        bool result = await handler.TryHandleAsync(ctx, ex, CancellationToken.None);

        result.ShouldBeTrue();
        ctx.Response.StatusCode.ShouldBe(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task TryHandleAsync_NullHttpContext_ThrowsArgumentNullException()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext _) = Build();
        await Should.ThrowAsync<ArgumentNullException>(
            async () => await handler.TryHandleAsync(null!, new InvalidOperationException(), CancellationToken.None));
    }

    [Fact]
    public async Task TryHandleAsync_NullException_ThrowsArgumentNullException()
    {
        (CustomExceptionHandler? handler, DefaultHttpContext? ctx) = Build();
        await Should.ThrowAsync<ArgumentNullException>(
            async () => await handler.TryHandleAsync(ctx, null!, CancellationToken.None));
    }

    private static (CustomExceptionHandler handler, DefaultHttpContext ctx)
        Build(string environment = "Production", bool isAuthenticated = false)
    {
        Mock<ILogger<CustomExceptionHandler>> logger = new();
        Mock<IHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(environment);

        DefaultHttpContext ctx = new();
        ctx.Response.Body = new MemoryStream();
        ctx.TraceIdentifier = "test-trace";

        if (isAuthenticated)
        {
            ctx.User = new ClaimsPrincipal(
                new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "user-123")], "Bearer"));
        }

        CustomExceptionHandler handler = new(logger.Object, env.Object);
        return (handler, ctx);
    }
}
