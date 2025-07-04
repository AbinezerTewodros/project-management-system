using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public interface IUserService
    {
        Task<RegisterResponseDto> RegisterUserAsync(RegisterUserDto registerDto);
        Task<bool> ChangePasswordAsync(ChangePasswordDto changePasswordDto);
        Task<ApplicationUser?> GetUserByUsernameAsync(string username);
        Task<ApplicationUser?> GetUserByEmployeeIdAsync(string employeeId);
        Task<ApplicationUser> FindUserByIdentifierAsync(string identifier);
<<<<<<< HEAD
<<<<<<< HEAD
        Task<List<SearchUserDto>> SearchUsersAsync(string query, string? department = null);
=======
>>>>>>> 890391528c11f4793f7d61f942815184bf328287
=======
>>>>>>> 890391528c11f4793f7d61f942815184bf328287
    }
}
