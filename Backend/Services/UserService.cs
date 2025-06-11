using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;

        public UserService(UserManager<ApplicationUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<RegisterResponseDto> RegisterUserAsync(RegisterUserDto registerDto)
        {
            var user = new ApplicationUser
            {
                FullName = registerDto.FullName,
                Email = registerDto.Email,
                UserName = registerDto.Username,
                Department = registerDto.Department,
                EmployeeId = registerDto.EmployeeId,
                Company = registerDto.Company,
                Title = registerDto.Title,
                PhoneNumber = registerDto.PhoneNumber,
                IsFirstLogin = true,
                Status = "Active"
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return new RegisterResponseDto { Success = false, Errors = errors };
            }

            await _userManager.AddToRoleAsync(user, registerDto.Role ?? "User");

            return new RegisterResponseDto { Success = true };
        }

        public async Task<bool> ChangePasswordAsync(ChangePasswordDto changePasswordDto)
        {
            var user = await _userManager.FindByNameAsync(changePasswordDto.Username);
            if (user == null) return false;

            var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            if (!result.Succeeded) return false;

            user.IsFirstLogin = false;
            await _userManager.UpdateAsync(user);

            user.LastPasswordChange = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<ApplicationUser?> GetUserByUsernameAsync(string username)
        {
            return await _userManager.Users.FirstOrDefaultAsync(u => u.UserName == username);
        }

        public async Task<ApplicationUser?> GetUserByEmployeeIdAsync(string employeeId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        }

        public async Task<ApplicationUser?> FindUserByIdentifierAsync(string identifier)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.EmployeeId == identifier || u.Email == identifier);
        }


    }
}
