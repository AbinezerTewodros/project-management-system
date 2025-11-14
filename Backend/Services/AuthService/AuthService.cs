using Azure.Core;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Common;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.JwtService;
using ProjectManagementSystem1.Services.AccessLogService;

namespace ProjectManagementSystem1.Services.AuthService
{
    public class AuthService : IAuthService
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext context;
        private readonly IJwtService _jwtService;
        private readonly IAccessLogService _accessLogService;

        public AuthService(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, IJwtService jwtService, AppDbContext _context, IAccessLogService accessLogService)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _jwtService = jwtService;
            context = _context;
            _accessLogService = accessLogService;
        }

        public async Task<TokenResponseDto?> LoginAsync(LoginRequestDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.Username);
            
            if (user == null)
            {
                await _accessLogService.LogLoginAsync(
                    userId: null,
                    userEmail: loginDto.Username,
                    status: "Failed",
                    errorMessage: "User not found"
                );
                return null;
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            
            if (!result.Succeeded)
            {
                await _accessLogService.LogLoginAsync(
                    userId: user.Id,
                    userEmail: user.Email,
                    status: "Failed",
                    errorMessage: "Invalid password"
                );
                return null;
            }

            await _accessLogService.LogLoginAsync(
                userId: user.Id,
                userEmail: user.Email,
                status: "Success"
            );

            var accessToken = await _jwtService.GenerateJwtTokenAsync(user);
            var refreshToken = GenerateRefreshToken(user);

            context.RefreshTokens.Add(refreshToken);
            await context.SaveChangesAsync();

            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Check if user is admin - admins should never need password change
            var userRoles = await _userManager.GetRolesAsync(user);
            var isAdmin = userRoles.Contains("Admin") || userRoles.Contains("Administrator");

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                IsFirstLogin = isAdmin ? false : user.IsFirstLogin
            };
        }

        private RefreshToken GenerateRefreshToken(ApplicationUser user)
        {
            return new RefreshToken
            {
                Token = Guid.NewGuid().ToString(), // You can use JWT or secure RNG if preferred
                UserId = user.Id,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token) || token.Length < 15)
                return null;

            var existing = await context.RefreshTokens
                .Include(r => r.User)
                .SingleOrDefaultAsync(r => r.Token == token);

            if (existing == null || existing.IsRevoked || existing.IsUsed || existing.Expires < DateTime.UtcNow)
                return null;

            // Mark old token as used
            existing.IsUsed = true;
            existing.IsRevoked = true;

            // Generate new tokens
            var accessToken = await _jwtService.GenerateJwtTokenAsync(existing.User);
            var newRefreshToken = GenerateRefreshToken(existing.User);

            context.RefreshTokens.Add(newRefreshToken);
            await context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken.Token
            };
        }
        public async Task LogoutAsync(string userId)
        {
            // Get user info for logging
            var user = await _userManager.FindByIdAsync(userId);
            var sessionDuration = user?.LastLogin.HasValue == true ? DateTime.UtcNow - user.LastLogin.Value : TimeSpan.Zero;

            var tokens = context.RefreshTokens
                .Where(r => r.UserId == userId && !r.IsRevoked && !r.IsUsed);

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }

            await context.SaveChangesAsync();

            // Log logout
            if (user != null)
            {
                await _accessLogService.LogLogoutAsync(
                    userId: user.Id,
                    userEmail: user.Email,
                    sessionDuration: sessionDuration
                );
            }
        }

    }
}
