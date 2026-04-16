// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.IdentityModel.Tokens;

namespace BjjEire.Core.Common;

public static class TestTokenFactory
{
    public const string TestIssuer = "integration-test-issuer";
    public const string TestAudience = "integration-test-audience";

    public static readonly SymmetricSecurityKey SigningKey =
        new(Encoding.UTF8.GetBytes("integration-test-signing-key-that-is-at-least-32-bytes-long"));

    public static string Generate(string userId = "test-user@example.com")
    {
        Claim[] claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        JwtSecurityToken token = new(
            issuer: TestIssuer,
            audience: TestAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
