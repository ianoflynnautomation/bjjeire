
using BjjWorld.Application.Common.Interfaces.Authentication;
using BjjWorld.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace BjjWorld.Api.Infrastructure;

public class ApiAuthenticationRegistrar
{
    public void AddAuthentication(AuthenticationBuilder builder, IConfiguration configuration)
    {
        builder.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            var config = new BackendAPIOptions();
            configuration.GetSection("BackendAPI").Bind(config);
            options.TokenValidationParameters = new TokenValidationParameters {
                ValidateIssuer = config.ValidateIssuer,
                ValidateAudience = config.ValidateAudience,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = config.ValidIssuer,
                ValidAudience = config.ValidAudience,
                IssuerSigningKey = JwtSecurityKey.Create(config.SecretKey)
            };

            options.Events = new JwtBearerEvents {
                OnAuthenticationFailed = async context =>
                {
                    context.NoResult();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "text/plain";
                    await context.Response.WriteAsync(context.Exception.Message);
                },                
                OnTokenValidated = async context =>
                {
                    try
                    {
                        if (config.Enabled)
                        {
                            var jwtAuthentication = context.HttpContext.RequestServices
                                .GetRequiredService<IJwtBearerAuthenticationService>();
                            if (!await jwtAuthentication.Valid(context))
                                throw new Exception(await jwtAuthentication.ErrorMessage());
                        }
                        else
                        {
                            throw new Exception("API is disabled");
                        }
                    }
                    catch (Exception ex)
                    {
                        throw new Exception(ex.Message);
                    }
                }
            };
        });
    }
}