namespace BjjWorld.Application.Common.Interfaces;

public interface IAuditInfoProvider
{
    public string GetCurrentUser();
    public DateTime GetCurrentDateTime();
}