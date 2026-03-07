using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor contextAccessor) : IAuditInfoProvider
{

    public string GetCurrentUser() => string.Empty;

    public DateTime GetCurrentDateTime() => DateTime.UtcNow;
}
