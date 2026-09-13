using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace WorkJournalApi.Auth;

public class JwtTokenService
{
    private readonly string _key;
    private readonly string _issuer;
    private readonly int _expireMinutes;

    public JwtTokenService(IConfiguration config)
    {
        var section = config.GetSection("Jwt");
        _key = section["Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings.json");
        _issuer = section["Issuer"] ?? "WorkJournalApi";
        _expireMinutes = int.TryParse(section["ExpireMinutes"], out var m) ? m : 480;
    }

    public string CreateToken(int userId, string username, string displayName, string role, int tokenVersion)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim("displayName", displayName),
            new Claim("tokenVersion", tokenVersion.ToString()),
        };

        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expireMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
