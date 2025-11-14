using ProjectManagementSystem1.Model.Dto.UserProfileDto;

namespace ProjectManagementSystem1.Services.UserProfile
{
    public interface IUserProfileService
    {
        Task<UserProfileDto> GetProfileAsync(string userId);
        Task<bool> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    }

}
