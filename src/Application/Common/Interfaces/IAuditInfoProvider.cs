namespace BjjEire.Application.Common.Interfaces;

public interface IAuditInfoProvider
{
    public string GetCurrentUser();
    public DateTime GetCurrentDateTime();
}