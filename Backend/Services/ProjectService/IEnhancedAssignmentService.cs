using ProjectManagementSystem1.Model.Dto.ProjectDto;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public interface IEnhancedAssignmentService
    {
        // Enhanced Assignment Management
        Task<EnhancedAssignmentDto> CreateAssignmentAsync(CreateEnhancedAssignmentDto dto, string currentUser);
        Task<EnhancedAssignmentDto> UpdateAssignmentAsync(int assignmentId, UpdateAssignmentDto dto, string currentUser);
        Task<bool> DeleteAssignmentAsync(int assignmentId, string currentUser);
        Task<EnhancedAssignmentDto> GetAssignmentAsync(int assignmentId);
        Task<List<EnhancedAssignmentDto>> GetProjectAssignmentsAsync(int projectId);
        
        // Multiple Scrum Master Support
        Task<List<ScrumMasterDto>> GetProjectScrumMastersAsync(int projectId);
        Task<MultipleScrumMasterDto> GetMultipleScrumMastersAsync(int projectId);
        Task<bool> SetPrimaryScrumMasterAsync(int projectId, string memberId, string currentUser);
        Task<bool> AddScrumMasterAsync(int projectId, string memberId, bool isPrimary, string currentUser);
        Task<bool> RemoveScrumMasterAsync(int projectId, string memberId, string currentUser);
        
        // Availability Tracking
        Task<MemberAvailabilityDto> GetMemberAvailabilityAsync(string memberId);
        Task<List<MemberAvailabilityDto>> GetAllMembersAvailabilityAsync();
        Task<List<MemberAvailabilityDto>> GetAvailableMembersForProjectAsync(int projectId, double requiredWorkload = 100.0);
        Task<bool> CheckMemberAvailabilityAsync(string memberId, double requiredWorkload);
        
        // Reassignment
        Task<EnhancedAssignmentDto> ReassignMemberAsync(ReassignmentRequestDto request, string currentUser);
        Task<List<EnhancedAssignmentDto>> GetReassignmentHistoryAsync(string memberId);
        
        // Workload Management
        Task<double> GetMemberTotalWorkloadAsync(string memberId);
        Task<bool> ValidateWorkloadAssignmentAsync(string memberId, double newWorkload);
        Task<List<ProjectWorkloadDto>> GetMemberProjectWorkloadsAsync(string memberId);
    }
}
