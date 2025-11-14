// Services/DownloadTokenService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public class DownloadTokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly ILogger<DownloadTokenService> _logger;
    public DownloadTokenService(IConfiguration config, ILogger<DownloadTokenService> logger)
    {
        _secretKey = config["JwtSettings:SecretKey"];
        _issuer = config["JwtSettings:Issuer"];
        _logger = logger;
    }

    public string GenerateToken(Guid attachmentId, TimeSpan expiry)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("attachmentId", attachmentId.ToString()),
                new Claim("purpose", "download")
            }),
            Expires = DateTime.UtcNow.Add(expiry),
            Issuer = _issuer,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };
        
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public bool ValidateToken(string token, Guid attachmentId)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = false,
                ValidateLifetime = true
            }, out _);

            var jwt = tokenHandler.ReadJwtToken(token);
            return jwt.Claims.Any(c =>
                c.Type == "attachmentId" &&
                c.Value == attachmentId.ToString());
        }
        catch(Exception ex) 
        {
            _logger.LogError(ex, "Token validation failed");
            return false;
        }
    }
}