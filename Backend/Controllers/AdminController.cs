using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;

namespace ProjectManagementSystem1.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IADService _adService; // Service for Active Directory fetch
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IUserService _userService;

        public AdminController(UserManager<ApplicationUser> userManager, IADService adService, RoleManager<IdentityRole> roleManager, IUserService userService)
        {
            _userManager = userManager;
            _adService = adService;
            _roleManager = roleManager;
            _userService = userService;
        }


        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _adService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request?.EmployeeId))
                return BadRequest(new { message = "Employee ID is required." });

            // Try fetching user from AD
            var adUser = await _adService.GetUserByEmployeeIdAsync(request.EmployeeId);

            ApplicationUser newUser;

            if (adUser == null)
            {
                // No AD record found, require manual entry
                if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
                    return NotFound(new { message = "User not found in Active Directory. Please enter full details manually." });

                newUser = new ApplicationUser
                {
                    FullName = request.FullName,
                    UserName = request.Username,
                    Email = request.Email,
                    Department = request.Department,
                    EmployeeId = request.EmployeeId,
                    PhoneNumber = request.PhoneNumber,
                    Company = request.Company,
                    Title = request.Title,
                    Status = "Active",
                    IsFirstLogin = true
                };
            }
            else
            {
                // AD record found, autofill details
                newUser = new ApplicationUser
                {
                    FullName = adUser.FullName,
                    UserName = adUser.Username,
                    Email = adUser.Email,
                    Department = adUser.Department,
                    EmployeeId = adUser.EmployeeId,
                    PhoneNumber = adUser.PhoneNumber,
                    Company = adUser.Company,
                    Title = adUser.Title,
                    Status = "Active",
                    IsFirstLogin = true
                };
            }

            // Create user with default password
            var result = await _userManager.CreateAsync(newUser, "Welcome2cbe");

            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            // Assign role (Admin manually selects)
            if (!await _roleManager.RoleExistsAsync(request.Role))
                return BadRequest(new { message = "Selected role does not exist." });

            await _userManager.AddToRoleAsync(newUser, request.Role);

            return Ok(new { message = "User created successfully.", userId = newUser.Id });
        }

        [HttpPut("edit-user")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> EditUser(EditUserDto dto)
        {
            var user = await _userService.FindUserByIdentifierAsync(dto.Identifier);
            if (user == null) return NotFound("User not found.");

            user.FullName = dto.FullName ?? user.FullName;
            user.Email = dto.Email ?? user.Email;
            user.Department = dto.Department ?? user.Department;
            user.Title = dto.Title ?? user.Title;
            user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
            //user.Role = dto.Role ?? user.Role;
            user.Company = dto.Company ?? user.Company;
            //user.Status = dto.Status;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest("Failed to update user.");

            return Ok("✅ User updated successfully.");
        }

        [HttpDelete("delete-user/{identifier}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteUser(string identifier)
        {
            var user = await _userService.FindUserByIdentifierAsync(identifier);
            if (user == null) return NotFound("User not found.");

            user.Status = "Inactive";

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest("Failed to deactivate user.");

            return Ok("🗑️ User deactivated.");
        }

    }
}
