using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.UserService;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUserService _userService;

        public UserController(UserManager<ApplicationUser> userManager, IUserService userService)
        {
            _userManager = userManager;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.EmployeeId,
                    u.Email,
                    u.Department,
                    u.PhoneNumber,
                    u.Title,
                    u.Company
                }).ToListAsync();

            return Ok(users);
        }

        [HttpGet("users-by-department/{departmentName}")]
        public async Task<IActionResult> GetUsersByDepartment(string departmentName)
        {
            var users = await _userManager.Users
                .Where(u => u.Department.ToLower() == departmentName.ToLower())
                .Select(u => new
                {
                    u.FullName,
                    u.EmployeeId,
                    u.Email,
                    u.Department,        
                    u.PhoneNumber
                }).ToListAsync();

            return Ok(users);
        }

        [HttpGet("users-by-manager/{manager}")]
        public async Task<IActionResult> GetUsersByManager(string manager)
        {
            var users = await _userManager.Users
                //.Where(u => u.Manager.ToLower() == manager.ToLower())
                .Where(u => u.ReportsToUserId == manager)
                .Select(u => new
                {
                    u.FullName,
                    u.EmployeeId,
                    u.Email,
                    u.Department,
                    u.PhoneNumber
                }).ToListAsync();

            return Ok(users);
        }

        [HttpPost("change-password")]
        [AllowAnonymous] // Allow anonymous for first login password change
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || 
                string.IsNullOrWhiteSpace(dto.CurrentPassword) || 
                string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new { message = "Username, current password, and new password are required." });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "New password must be at least 6 characters long." });
            }

            var success = await _userService.ChangePasswordAsync(dto);
            
            if (!success)
            {
                return BadRequest(new { message = "Failed to change password. Please check your current password." });
            }

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.Identity?.Name;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated." });

            var user = await _userManager.FindByNameAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.UserName,
                user.EmployeeId,
                user.Department,
                user.Title,
                user.Company,
                user.PhoneNumber,
                user.Status,
                user.IsFirstLogin,
                user.LastLogin,
                Roles = roles
            });
        }
    }
}
