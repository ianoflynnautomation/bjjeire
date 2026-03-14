namespace BjjEire.Infrastructure.UnitTests;

[Trait("Category", "Infrastructure")]
[Trait("Category", "Unit")]
public sealed class AuditInfoProviderTests
{

    [Fact]
    public void GetCurrentDateTime_ReturnsUtcDateTime()
    {
        var provider = new AuditInfoProvider(new Mock<IHttpContextAccessor>().Object);

        var result = provider.GetCurrentDateTime();

        result.Kind.ShouldBe(DateTimeKind.Utc);
        (DateTime.UtcNow - result).ShouldBeLessThan(TimeSpan.FromSeconds(1));
    }


    [Fact]
    public void GetCurrentUser_WhenHttpContextIsNull_ReturnsSystem()
    {
        var accessor = new Mock<IHttpContextAccessor>();
        accessor.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        var result = new AuditInfoProvider(accessor.Object).GetCurrentUser();

        result.ShouldBe("system");
    }

    [Fact]
    public void GetCurrentUser_WhenNameIdentifierClaimPresent_ReturnsClaimValue()
    {
        var httpContext = ContextWithClaims(new Claim(ClaimTypes.NameIdentifier, "user-abc"));

        var result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("user-abc");
    }

    [Fact]
    public void GetCurrentUser_WhenNoNameIdentifierButHasIdentityName_ReturnsIdentityName()
    {
        // ClaimsIdentity sets Identity.Name from the ClaimTypes.Name claim.
        var httpContext = ContextWithClaims(new Claim(ClaimTypes.Name, "jane.doe"));

        var result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("jane.doe");
    }

    [Fact]
    public void GetCurrentUser_WhenBothNameIdentifierAndNamePresent_PrefersNameIdentifier()
    {
        var httpContext = ContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, "user-id-001"),
            new Claim(ClaimTypes.Name, "jane.doe"));

        var result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("user-id-001");
    }

    [Fact]
    public void GetCurrentUser_WhenUserHasNoRelevantClaims_ReturnsSystem()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());
        var httpContext = new DefaultHttpContext { User = principal };

        var result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("system");
    }


    private static HttpContext ContextWithClaims(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
    }

    private static IHttpContextAccessor AccessorFor(HttpContext ctx)
    {
        var mock = new Mock<IHttpContextAccessor>();
        mock.Setup(x => x.HttpContext).Returns(ctx);
        return mock.Object;
    }
}
