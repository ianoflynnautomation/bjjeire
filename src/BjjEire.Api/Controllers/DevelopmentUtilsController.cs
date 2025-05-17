
using BjjEire.Api.Attributes;
using BjjEire.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BjjEire.Api.Controllers;

public class DevelopmentUtilsController(IOptions<JwtOptions> jwtOptionsAccessor, IWebHostEnvironment env) : BaseApiController {
    private readonly JwtOptions _jwtOptions = jwtOptionsAccessor.Value;
    private readonly IWebHostEnvironment _env = env;

    [DevelopmentOnly]
    [HttpGet("generate-token")]
    //[ApiExplorerSettings(IgnoreApi = true)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GenerateToken([FromQuery] string? userId = "dev-user@example.com", [FromQuery] string? role = null) {
        ArgumentNullException.ThrowIfNull(userId);
        if (!_env.IsDevelopment()) {
            return NotFound("This endpoint is only available in the Development environment.");
        }

        if (string.IsNullOrWhiteSpace(_jwtOptions.Key) ||
            string.IsNullOrWhiteSpace(_jwtOptions.Issuer) ||
            string.IsNullOrWhiteSpace(_jwtOptions.Audience)) {
            return Problem("JWT options (Key, Issuer, Audience) are not configured correctly on the server.",
                           statusCode: StatusCodes.Status500InternalServerError,
                           title: "JWT Configuration Error");
        }

        var claims = new List<Claim>
        {
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Sub, userId),
                new(ClaimTypes.NameIdentifier, userId.Split('@')[0] + "-id"),
                new(ClaimTypes.Name, userId)
            };

        if (!string.IsNullOrWhiteSpace(role)) {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }
        // Add any other claims you need for testing

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.DurationInMinutes);

        var tokenDescriptor = new SecurityTokenDescriptor {
            Subject = new ClaimsIdentity(claims),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Expires = expires,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return Ok(new { token = tokenString, expiresUtc = expires, userId, role });
    }

}