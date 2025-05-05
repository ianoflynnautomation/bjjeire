using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BjjWorld.Api.Infrastructure;

public static class JwtSecurityKey
{
    public static SymmetricSecurityKey Create(string secret)
    {
        return new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret));
    }
}