using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Infrastructure;

public class AuditInfoProvider(IHttpContextAccessor contextAccessor) : IAuditInfoProvider
{
    private readonly IHttpContextAccessor _contextAccessor = contextAccessor;

    public DateTime GetCurrentDateTime() => DateTime.UtcNow;
    public string GetCurrentUser() => throw new NotImplementedException();
}
