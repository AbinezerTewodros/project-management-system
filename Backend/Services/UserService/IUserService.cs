using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.UserService
{
    public interface IUserService
    {
        Task<RegisterResponseDto> RegisterUserAsync(RegisterUserDto registerDto);
        Task<bool> ChangePasswordAsync(ChangePasswordDto changePasswordDto);
        Task<ApplicationUser?> GetUserByUsernameAsync(string username);
        Task<ApplicationUser?> GetUserByEmployeeIdAsync(string employeeId);
        Task<ApplicationUser> FindUserByIdentifierAsync(string identifier);
        Task ArchiveUserAsync(string userId, string currentUser);
        Task RestoreUserAsync(string userId, string currentUser);
    }
}
