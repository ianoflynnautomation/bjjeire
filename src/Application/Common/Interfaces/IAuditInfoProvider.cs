namespace BjjWorld.Application.Common.Interfaces;

public interface IAuditInfoProvider
{
    string GetCurrentUser();
    DateTime GetCurrentDateTime();
}