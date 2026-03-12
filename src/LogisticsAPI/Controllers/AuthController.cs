using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return Conflict(new { error = "A user with this email already exists." });

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                TenantId = 1 // Default tenant for new registrations
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            var authResponse = await GenerateAuthResponse(user);
            return Ok(authResponse);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                return Unauthorized(new { error = "Invalid email or password." });

            var authResponse = await GenerateAuthResponse(user);
            return Ok(authResponse);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            var principal = GetPrincipalFromExpiredToken(request.Token);
            if (principal == null)
                return Unauthorized(new { error = "Invalid token." });

            var email = principal.FindFirstValue(ClaimTypes.Email);
            if (email == null)
                return Unauthorized(new { error = "Invalid token claims." });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null ||
                user.RefreshToken != HashToken(request.RefreshToken) ||
                user.RefreshTokenExpiry <= DateTime.UtcNow)
            {
                return Unauthorized(new { error = "Invalid or expired refresh token." });
            }

            var authResponse = await GenerateAuthResponse(user);
            return Ok(authResponse);
        }

        private async Task<AuthResponse> GenerateAuthResponse(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                jwtSettings["Secret"] ?? "dev-jwt-secret-key-min-32-chars!!"));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Email, user.Email!),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("tenant_id", user.TenantId.ToString())
            };

            if (!string.IsNullOrEmpty(user.FullName))
                claims.Add(new Claim("full_name", user.FullName));

            var expirationMinutes = int.TryParse(jwtSettings["ExpirationMinutes"], out var mins) ? mins : 60;
            var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "LogisticsAPI",
                audience: jwtSettings["Audience"] ?? "LogisticsDashboard",
                claims: claims,
                expires: expiration,
                signingCredentials: credentials
            );

            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = HashToken(refreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            return new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                RefreshToken = refreshToken,
                Expiration = expiration,
                Email = user.Email!,
                FullName = user.FullName,
                TenantId = user.TenantId
            };
        }

        private static string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(bytes);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(
                jwtSettings["Secret"] ?? "dev-jwt-secret-key-min-32-chars!!");

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"] ?? "LogisticsAPI",
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"] ?? "LogisticsDashboard",
                ValidateLifetime = false // Allow expired tokens for refresh
            };

            try
            {
                var principal = new JwtSecurityTokenHandler()
                    .ValidateToken(token, tokenValidationParameters, out var securityToken);

                if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
                        StringComparison.InvariantCultureIgnoreCase))
                {
                    return null;
                }

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
