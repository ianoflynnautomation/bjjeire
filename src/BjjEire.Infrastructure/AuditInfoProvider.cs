using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor contextAccessor) : IAuditInfoProvider
{

    public DateTime GetCurrentDateTime() => DateTime.UtcNow;
    public string GetCurrentUser() => throw new NotImplementedException();
}
