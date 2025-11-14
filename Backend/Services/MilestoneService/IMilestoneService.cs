using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public interface IMilestoneService
    {
        Task<MilestoneReadDto> GetMilestoneByIdAsync(int id);
        Task<IEnumerable<MilestoneReadDto>> GetAllMilestoneAsync();
        Task<IEnumerable<MilestoneReadDto>> GetMilestonesByProjectIdAsync(int projectId);
        Task<MilestoneReadDto> CreateAsync(CreateMilestoneDto dto);
        Task<List<string>> GetTeamMembersAsync(int milestoneId);
        Task AddTeamMemberAsync(int milestoneId, string memberId, bool setAsPrimary = false);
        Task AddTeamMemberWithRoleAsync(int milestoneId, string memberId, string role = "Contributor", bool isLead = false);
        Task RemoveTeamMemberAsync(int milestoneId, string memberId);
        Task<MilestoneReadDto> UpdateMilestoneAsync(int id, UpdateMilestoneDto dto);
        Task<List<MilestoneMember>> GetMilestoneMembersWithRolesAsync(int milestoneId);
        Task ValidateMemberIsInProjectAsync(int milestoneId, string memberId);
        Task UpdateMemberRoleAsync(int milestoneId, string memberId, string newRole, bool isLead);
        Task<bool> DeleteMilestoneAsync(int id);
        Task<double> CalculateMilestoneProgress(int milestoneId);
        Task UpdateMilestoneProgress(int milestoneId);

        // Assignment Approval Methods
        Task SetPrimaryAssigneeAsync(int milestoneId, string memberId);
        Task AcceptMilestoneAssignmentAsync(int milestoneId, string userId);
        Task RejectMilestoneAssignmentAsync(int milestoneId, string userId, string reason);
        Task<List<MilestoneReadDto>> GetPendingMilestonesForUserAsync(string userId);
        Task<List<MilestoneReadDto>> GetMilestonesAssignedToUserAsync(string userId);    
    }
}
