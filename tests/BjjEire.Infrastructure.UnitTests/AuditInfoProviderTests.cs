namespace BjjEire.Infrastructure.UnitTests;

[Trait("Category", "Infrastructure")]
[Trait("Category", "Unit")]
public sealed class AuditInfoProviderTests
{

    [Fact]
    public void GetCurrentDateTime_ReturnsUtcDateTime()
    {
        AuditInfoProvider provider = new(new Mock<IHttpContextAccessor>().Object);

        DateTime result = provider.GetCurrentDateTime();

        result.Kind.ShouldBe(DateTimeKind.Utc);
        (DateTime.UtcNow - result).ShouldBeLessThan(TimeSpan.FromSeconds(1));
    }


    [Fact]
    public void GetCurrentUser_WhenHttpContextIsNull_ReturnsSystem()
    {
        Mock<IHttpContextAccessor> accessor = new();
        accessor.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        string result = new AuditInfoProvider(accessor.Object).GetCurrentUser();

        result.ShouldBe("system");
    }

    [Fact]
    public void GetCurrentUser_WhenNameIdentifierClaimPresent_ReturnsClaimValue()
    {
        HttpContext httpContext = ContextWithClaims(new Claim(ClaimTypes.NameIdentifier, "user-abc"));

        string result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("user-abc");
    }

    [Fact]
    public void GetCurrentUser_WhenNoNameIdentifierButHasIdentityName_ReturnsIdentityName()
    {
        // ClaimsIdentity sets Identity.Name from the ClaimTypes.Name claim.
        HttpContext httpContext = ContextWithClaims(new Claim(ClaimTypes.Name, "jane.doe"));

        string result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("jane.doe");
    }

    [Fact]
    public void GetCurrentUser_WhenBothNameIdentifierAndNamePresent_PrefersNameIdentifier()
    {
        HttpContext httpContext = ContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, "user-id-001"),
            new Claim(ClaimTypes.Name, "jane.doe"));

        string result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("user-id-001");
    }

    [Fact]
    public void GetCurrentUser_WhenUserHasNoRelevantClaims_ReturnsSystem()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());
        DefaultHttpContext httpContext = new()
        { User = principal };

        string result = new AuditInfoProvider(AccessorFor(httpContext)).GetCurrentUser();

        result.ShouldBe("system");
    }


    private static HttpContext ContextWithClaims(params Claim[] claims)
    {
        ClaimsIdentity identity = new(claims, "TestAuth");
        return new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
    }

    private static IHttpContextAccessor AccessorFor(HttpContext ctx)
    {
        Mock<IHttpContextAccessor> mock = new();
        mock.Setup(x => x.HttpContext).Returns(ctx);
        return mock.Object;
    }
}
