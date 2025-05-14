using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BjjEire.Api.Infrastructure;

public static class JwtSecurityKey
{
    public static SymmetricSecurityKey Create(string secret) 
    => new(Encoding.ASCII.GetBytes(secret));
}