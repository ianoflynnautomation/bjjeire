using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace BjjWorld.Application.Common.Interfaces.Authentication;

public interface IJwtBearerAuthenticationService
{
    Task<bool> Valid(TokenValidatedContext context);
    Task<string> ErrorMessage();
}