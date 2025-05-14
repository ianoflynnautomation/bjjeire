using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace BjjEire.Application.Common.Interfaces.Authentication;

public interface IJwtBearerAuthenticationService {
    public Task<bool> Valid(TokenValidatedContext context);
    public Task<string> ErrorMessage();
}