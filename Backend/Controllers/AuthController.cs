using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AuthService;
using ProjectManagementSystem1.Services.UserService;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
       

        public AuthController(IUserService userService, IAuthService authService, UserManager<ApplicationUser> userManager,SignInManager<ApplicationUser> signInManager)
        {
            _userService = userService;
            _authService = authService;
            _userManager = userManager;
            _signInManager = signInManager;

        }

        [HttpPost("register")]
        [Authorize(Policy = "AdminOnly")] // Optional: only admins can register users
        public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
        {
            var result = await _userService.RegisterUserAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new { errors = result.Errors });
            }

            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            var jwtResponse = await _authService.LoginAsync(dto);
            if (jwtResponse == null)
                return Unauthorized(new { message = "Invalid credentials." });

            if (jwtResponse.IsFirstLogin)
                return Ok(new { message = "First login. Password change required.", jwtResponse });

            return Ok(jwtResponse);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            var response = await _authService.RefreshTokenAsync(request.Token);
            if (response == null) return Unauthorized(new { message = "Invalid or expired refresh token." });

            return Ok(response);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid user or session." });
            await _authService.LogoutAsync(userId);
            await _signInManager.SignOutAsync();

            return Ok(new { message = "Logged out successfully." });
        }

        // Cookie-based login (for web clients)
        [HttpPost("cookie-login")]
        [AllowAnonymous]
        public async Task<IActionResult> CookieLogin([FromBody] LoginRequestDto dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials." });

            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid credentials." });

            await _signInManager.SignInAsync(user, isPersistent: true);

            // Demo session value
            HttpContext.Session.SetString("LastLoginUser", user.UserName ?? string.Empty);

            return Ok(new { message = "Signed in with cookie.", user = new { user.UserName, user.Email } });
        }

        [HttpPost("cookie-logout")]
        [Authorize]
        public async Task<IActionResult> CookieLogout()
        {
            await _signInManager.SignOutAsync();
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return Ok(new { message = "Signed out and session cleared." });
        }

        [HttpGet("session-demo")]
        [Authorize]
        public IActionResult SessionDemo()
        {
            var visits = HttpContext.Session.GetInt32("Visits") ?? 0;
            visits++;
            HttpContext.Session.SetInt32("Visits", visits);
            var lastUser = HttpContext.Session.GetString("LastLoginUser");
            return Ok(new { visits, lastUser });
        }

    }
}
