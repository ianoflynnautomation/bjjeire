using System.Security.Claims;

using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor contextAccessor) : IAuditInfoProvider
{
    public DateTime GetCurrentDateTime() => DateTime.UtcNow;

    public string GetCurrentUser() =>
        contextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? contextAccessor.HttpContext?.User?.Identity?.Name
        ?? "system";
}
