using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ADService;
using ProjectManagementSystem1.Services.UserService;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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

        [HttpGet("all-users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.UserName,
                    u.EmployeeId,
                    u.PhoneNumber,
                    u.Department,
                    u.Status,
                    u.Company,
                    u.Title,
                })
                .ToListAsync();

            return Ok(users);
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

        // ========== AD Integration (Preview + Import) ==========
        [HttpGet("ad/users/{empId}")]
        public async Task<IActionResult> PreviewAdUser(string empId)
        {
            try
            {
                // Reuse ADAuth service semantics via ADService if available; otherwise direct ADAuth could be injected
                var adAuth = HttpContext.RequestServices.GetRequiredService<IADAuthService>();
                var adUser = adAuth.GetEmployee(empId);
                if (adUser == null) return NotFound("User not found in AD");
                return Ok(adUser);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class ImportAdUserRequest
        {
            public string Password { get; set; } = "Welcome2cbe";
            public string? Role { get; set; } // Optional; infer from Title if null
        }

        [HttpPost("ad/import/{empId}")]
        public async Task<IActionResult> ImportAdUser(string empId, [FromBody] ImportAdUserRequest request)
        {
            try
            {
                var adAuth = HttpContext.RequestServices.GetRequiredService<IADAuthService>();
                var adUser = adAuth.GetEmployee(empId);
                if (adUser == null) return NotFound("User not found in AD");

                // Infer role from title if not provided
                var role = string.IsNullOrWhiteSpace(request.Role)
                    ? InferRoleFromTitle(adUser.Title)
                    : request.Role;

                // Ensure role exists
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }

                // Create ApplicationUser
                var newUser = new ApplicationUser
                {
                    UserName = adUser.Email ?? adUser.EmpId,
                    Email = adUser.Email,
                    FullName = adUser.Name,
                    EmployeeId = adUser.EmpId,
                    Department = adUser.Department ?? string.Empty,
                    Title = adUser.Title ?? string.Empty,
                    Company = adUser.Company ?? string.Empty,
                    Manager = ExtractCnCommonName(adUser.Manager),
                    PhoneNumber = null,
                    Status = "Active",
                    IsFirstLogin = true
                };

                // If exists, update instead
                var existing = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.EmployeeId == newUser.EmployeeId || u.Email == newUser.Email);
                if (existing != null)
                {
                    existing.FullName = newUser.FullName;
                    existing.Department = newUser.Department;
                    existing.Title = newUser.Title;
                    existing.Company = newUser.Company;
                    existing.Manager = newUser.Manager;
                    existing.UpdatedDate = DateTime.UtcNow;
                    await _userManager.UpdateAsync(existing);
                    await EnsureUserInRole(existing, role);
                    return Ok(new { message = "User updated from AD.", userId = existing.Id, role });
                }

                var create = await _userManager.CreateAsync(newUser, request.Password);
                if (!create.Succeeded)
                    return BadRequest(new { errors = create.Errors.Select(e => e.Description) });

                await EnsureUserInRole(newUser, role);
                return Ok(new { message = "User created from AD.", userId = newUser.Id, role });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ad/import-batch")]
        public async Task<IActionResult> ImportAdUsersBatch([FromBody] List<string> empIds)
        {
            var adAuth = HttpContext.RequestServices.GetRequiredService<IADAuthService>();
            var results = new List<object>();
            foreach (var empId in empIds)
            {
                try
                {
                    var adUser = adAuth.GetEmployee(empId);
                    if (adUser == null)
                    {
                        results.Add(new { empId, status = "NotFound" });
                        continue;
                    }
                    var role = InferRoleFromTitle(adUser.Title);
                    if (!await _roleManager.RoleExistsAsync(role))
                        await _roleManager.CreateAsync(new IdentityRole(role));

                    var user = await _userManager.Users
                        .FirstOrDefaultAsync(u => u.EmployeeId == adUser.EmpId || u.Email == adUser.Email);
                    if (user == null)
                    {
                        user = new ApplicationUser
                        {
                            UserName = adUser.Email ?? adUser.EmpId,
                            Email = adUser.Email,
                            FullName = adUser.Name,
                            EmployeeId = adUser.EmpId,
                            Department = adUser.Department ?? string.Empty,
                            Title = adUser.Title ?? string.Empty,
                            Company = adUser.Company ?? string.Empty,
                            Manager = adUser.Manager,
                            Status = "Active",
                            IsFirstLogin = true
                        };
                        var create = await _userManager.CreateAsync(user, "Welcome2cbe");
                        if (!create.Succeeded)
                        {
                            results.Add(new { empId, status = "Error", errors = create.Errors.Select(e => e.Description) });
                            continue;
                        }
                    }
                    else
                    {
                        user.FullName = adUser.Name;
                        user.Department = adUser.Department ?? string.Empty;
                        user.Title = adUser.Title ?? string.Empty;
                        user.Company = adUser.Company ?? string.Empty;
                        user.Manager = ExtractCnCommonName(adUser.Manager);
                        user.UpdatedDate = DateTime.UtcNow;
                        await _userManager.UpdateAsync(user);
                    }

                    await EnsureUserInRole(user, role);
                    results.Add(new { empId, status = "OK", userId = user.Id, role });
                }
                catch (Exception ex)
                {
                    results.Add(new { empId, status = "Error", message = ex.Message });
                }
            }
            return Ok(results);
        }

        // Import users by OU path segment(s)
        public class ImportByOuRequest
        {
            public List<string> OrganizationalUnits { get; set; } = new();
            public string DefaultPassword { get; set; } = "Welcome2cbe";
        }

        [HttpPost("ad/import-by-ou")]
        public async Task<IActionResult> ImportUsersByOu([FromBody] ImportByOuRequest request)
        {
            if (request.OrganizationalUnits == null || request.OrganizationalUnits.Count == 0)
                return BadRequest("Provide at least one OU segment.");

            var adAuth = HttpContext.RequestServices.GetRequiredService<IADAuthService>();
            var users = await adAuth.GetUsersByOrganizationalUnitsAsync(request.OrganizationalUnits);
            var results = new List<object>();

            foreach (var emp in users)
            {
                try
                {
                    var role = InferRoleFromTitle(emp.Title);
                    if (!await _roleManager.RoleExistsAsync(role))
                        await _roleManager.CreateAsync(new IdentityRole(role));

                    var user = await _userManager.Users
                        .FirstOrDefaultAsync(u => u.EmployeeId == emp.EmpId || u.Email == emp.Email);
                    if (user == null)
                    {
                        user = new ApplicationUser
                        {
                            UserName = emp.Email ?? emp.EmpId,
                            Email = emp.Email,
                            FullName = emp.Name,
                            EmployeeId = emp.EmpId,
                            Department = emp.Department ?? string.Empty,
                            Title = emp.Title ?? string.Empty,
                            Company = emp.Company ?? string.Empty,
                            Manager = ExtractCnCommonName(emp.Manager),
                            Status = "Active",
                            IsFirstLogin = true
                        };
                        var create = await _userManager.CreateAsync(user, request.DefaultPassword);
                        if (!create.Succeeded)
                        {
                            results.Add(new { empId = emp.EmpId, status = "Error", errors = create.Errors.Select(e => e.Description) });
                            continue;
                        }
                    }
                    else
                    {
                        user.FullName = emp.Name;
                        user.Department = emp.Department ?? string.Empty;
                        user.Title = emp.Title ?? string.Empty;
                        user.Company = emp.Company ?? string.Empty;
                        user.Manager = ExtractCnCommonName(emp.Manager);
                        user.UpdatedDate = DateTime.UtcNow;
                        await _userManager.UpdateAsync(user);
                    }

                    await EnsureUserInRole(user, role);
                    results.Add(new { empId = emp.EmpId, status = "OK", userId = user.Id, role });
                }
                catch (Exception ex)
                {
                    results.Add(new { empId = emp.EmpId, status = "Error", message = ex.Message });
                }
            }

            return Ok(new { total = users.Count, results });
        }

        private static string InferRoleFromTitle(string? title)
        {
            if (string.IsNullOrWhiteSpace(title)) return "User";
            var t = title.ToLowerInvariant();
            if (t.Contains("president") || t.Contains("vp") || t.Contains("vice president")) return "Admin";
            if (t.Contains("director") || t.Contains("head")) return "Manager";
            if (t.Contains("manager") || t.Contains("lead") || t.Contains("supervisor")) return "Manager";
            return "User";
        }

        private async Task EnsureUserInRole(ApplicationUser user, string role)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains(role))
            {
                foreach (var r in roles)
                {
                    await _userManager.RemoveFromRoleAsync(user, r);
                }
                await _userManager.AddToRoleAsync(user, role);
            }
        }

        private static string? ExtractCnCommonName(string? dn)
        {
            if (string.IsNullOrWhiteSpace(dn)) return dn;
            const string prefix = "CN=";
            var start = dn.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            if (start < 0) return dn;
            start += prefix.Length;
            var end = dn.IndexOf(',', start);
            if (end < 0) end = dn.Length;
            return dn.Substring(start, end - start);
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

        //[HttpPost("archive/{employeeId}")]
        //[Authorize(Policy = "AdminOnly")]
        //public async Task<IActionResult> ArchiveUser(string employeeId)
        //{
        //    var currentUser = User.Identity?.Name;

        //    try
        //    {
        //        await _userService.ArchiveUserAsync(employeeId, currentUser);
        //        return Ok(new { Message = "User archived successfully" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest(new { Error = ex.Message });
        //    }
        //}

        //[HttpPost("restore/{employeeId}")]
        //[Authorize(Policy = "AdminOnly")]
        //public async Task<IActionResult> RestoreUser(string employeeId)
        //{
        //    var currentUser = User.Identity?.Name;

        //    try
        //    {
        //        await _userService.RestoreUserAsync(employeeId, currentUser);
        //        return Ok(new { Message = "User restored successfully" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest(new { Error = ex.Message });
        //    }
        //}



    }
}