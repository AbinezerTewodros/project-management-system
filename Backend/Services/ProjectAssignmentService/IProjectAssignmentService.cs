using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;

public interface IProjectAssignmentService
{
    Task<List<AssignmentDto>> GetAllByProjectAsync(int projectId);
    Task<List<UserProjectDto>> GetProjectsByEmployeeIdAsync(string employeeId, string requesterDept);
    Task<AssignmentDto?> GetByIdAsync(int id);
    Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, string currentUser);
    Task ApproveProjectAssignmentAsync(int assignmentId, string teamLeaderId);
    Task RejectProjectAssignmentAsync(int assignmentId, string teamLeaderId, string reason);
    Task<bool> UpdateAsync(int id, UpdateAssignmentDto dto, string currentUser);
    Task<bool> DeleteAsync(int id);
    //Task GetAllByProjectAsync(int projectId);
}
