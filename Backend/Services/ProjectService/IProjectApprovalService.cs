using ProjectManagementSystem1.Model.Dto.ProjectDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public interface IProjectApprovalService
    {
        Task<ProjectApprovalResponseDto> ApproveProjectAsync(ProjectApprovalRequestDto request);
        Task<ProjectApprovalResponseDto> RejectProjectAsync(ProjectApprovalRequestDto request);
        Task<List<PendingProjectApprovalDto>> GetPendingApprovalsAsync(string managerUserId);
        Task<ProjectApprovalResponseDto> GetProjectApprovalStatusAsync(int projectId);
        Task<bool> CanUserCreateProjectAsync(string userId);
        Task<bool> IsUserManagerOrAboveAsync(string userId);
        Task<List<ProjectApprovalResponseDto>> GetApprovalHistoryAsync(string userId);
    }
}
