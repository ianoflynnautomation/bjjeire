using BjjWorld.Application.Common.Interfaces;

namespace BjjWorld.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor contextAccessor) : IAuditInfoProvider {
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;

    public string GetCurrentUser() =>
        //return _contextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;
        string.Empty;

    public DateTime GetCurrentDateTime() => DateTime.UtcNow;
}