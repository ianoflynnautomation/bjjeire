using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor _) : IAuditInfoProvider
{
    public string GetCurrentUser() => string.Empty;

    public DateTime GetCurrentDateTime() => DateTime.UtcNow;
}
