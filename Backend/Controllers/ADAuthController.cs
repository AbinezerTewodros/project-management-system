using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.ADDto;
using ProjectManagementSystem1.Services.ADService;
using ProjectManagementSystem1.Services.AuthService;
using ProjectManagementSystem1.Services.JwtService;
using Microsoft.AspNetCore.Identity;
using ProjectManagementSystem1.Model.Entities;
using Microsoft.EntityFrameworkCore;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ADAuthController : ControllerBase
    {
        private readonly IADAuthService _adAuthService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtService _jwtService;

        public ADAuthController(IADAuthService adAuthService, UserManager<ApplicationUser> userManager, IJwtService jwtService)
        {
            _adAuthService = adAuthService;
            _userManager = userManager;
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
        {
            if (string.IsNullOrWhiteSpace(loginDto.Username) || string.IsNullOrWhiteSpace(loginDto.Password))
                return BadRequest("Username and password are required.");

            var result = _adAuthService.Authenticate(loginDto.Username, loginDto.Password);
            if (!result)
                return Unauthorized("Invalid credentials.");

            // Ensure local user exists or create a shadow account
            var employee = _adAuthService.GetEmployee(loginDto.Username);
            if (employee == null)
                return Unauthorized("AD user not found.");

            // Try to find existing ApplicationUser by EmployeeId or Email
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == employee.EmpId || u.Email == employee.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = employee.Email ?? employee.EmpId,
                    Email = employee.Email,
                    FullName = employee.Name,
                    EmployeeId = employee.EmpId,
                    Department = employee.Department ?? string.Empty,
                    Title = employee.Title ?? string.Empty,
                    Company = employee.Company ?? string.Empty,
                    //Manager = ExtractCnCommonName(employee.Manager),
                    ReportsToUserId = await ResolveManagerId(employee.Manager), // Set manager ID
                    Status = "Active",
                    IsFirstLogin = false
                };
                // Create without password, as auth is delegated to AD
                var create = await _userManager.CreateAsync(user);
                if (!create.Succeeded)
                    return BadRequest(new { errors = create.Errors.Select(e => e.Description) });

                // Infer role from title and assign if exists
                var role = InferRoleFromTitle(employee.Title);
                if (!string.IsNullOrEmpty(role))
                {
                    var roleMgr = HttpContext.RequestServices.GetRequiredService<RoleManager<IdentityRole>>();
                    if (!await roleMgr.RoleExistsAsync(role))
                        await roleMgr.CreateAsync(new IdentityRole(role));
                    await _userManager.AddToRoleAsync(user, role);
                }
            }
            else
            {
                // Update profile data from AD
                user.FullName = employee.Name;
                user.Department = employee.Department ?? string.Empty;
                user.Title = employee.Title ?? string.Empty;
                user.Company = employee.Company ?? string.Empty;
                //user.Manager = ExtractCnCommonName(employee.Manager);
                user.ReportsToUserId = await ResolveManagerId(employee.Manager); // Update manager ID
                await _userManager.UpdateAsync(user);
            }

            // Issue JWT for the local account
            var token = await _jwtService.GenerateJwtTokenAsync(user);
            return Ok(new { token, user = new { user.Id, user.FullName, user.Email } });

        }

        [HttpGet("employee/{empId}")]
        public ActionResult<EmployeeADDto> GetEmployee(string empId)
        {
            try
            {
                var employee = _adAuthService.GetEmployee(empId);
                return Ok(employee);
            }
            catch (Exception ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        // Extracts common name "First Middle Last" from distinguished name
        private static string? ExtractCnCommonName(string? dn)
        {
            if (string.IsNullOrWhiteSpace(dn)) return dn;
            // Expect formats like: CN=First Middle Last,OU=...,DC=...
            const string prefix = "CN=";
            var start = dn.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            if (start < 0) return dn;
            start += prefix.Length;
            var end = dn.IndexOf(',', start);
            if (end < 0) end = dn.Length;
            return dn.Substring(start, end - start);
        }

        private async Task<string?> ResolveManagerId(string? managerDn)
        {
            if (string.IsNullOrWhiteSpace(managerDn)) return null;
            var managerAdUser = _adAuthService.GetEmployeeByDn(managerDn); // Assume this method exists
            if (managerAdUser == null) return null;
            var manager = await _userManager.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == managerAdUser.EmpId || u.Email == managerAdUser.Email);
            return manager?.Id;
        }

        private static string InferRoleFromTitle(string? title)
        {
            if (string.IsNullOrWhiteSpace(title)) return "Member"; // ✅ FIXED: Use "Member" not "User"
            var t = title.ToLowerInvariant();
            if (t.Contains("president") || t.Contains("vp") || t.Contains("vice president")) return "Admin";
            if (t.Contains("director") || t.Contains("head")) return "Manager";
            if (t.Contains("manager") || t.Contains("lead") || t.Contains("supervisor")) return "Manager";
            return "Member"; // ✅ FIXED: Use "Member" not "User"
        }

    }
}
