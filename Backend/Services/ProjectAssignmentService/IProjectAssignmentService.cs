using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;

public interface IProjectAssignmentService
{
    Task<List<AssignmentDto>> GetAllByProjectAsync(int projectId, string requesterDept);
    Task<List<UserProjectDto>> GetProjectsByEmployeeIdAsync(string employeeId, string requesterDept);
    Task<AssignmentDto?> GetByIdAsync(int id);
    Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, string requesterDept, string currentUser);
    Task ApproveProjectAssignmentAsync(int assignmentId, string teamLeaderId);
    Task RejectProjectAssignmentAsync(int assignmentId, string teamLeaderId, string reason);
    Task<bool> UpdateAsync(int id, UpdateAssignmentDto dto, string currentUser);
    Task<bool> DeleteAsync(int id);
    //Task GetAllByProjectAsync(int projectId);
}
