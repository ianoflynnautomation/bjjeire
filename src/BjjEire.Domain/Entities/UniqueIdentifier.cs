
namespace BjjEire.Domain.Entities;

public static class UniqueIdentifier
{
    public static string New => ObjectId.GenerateNewId().ToString();
}
