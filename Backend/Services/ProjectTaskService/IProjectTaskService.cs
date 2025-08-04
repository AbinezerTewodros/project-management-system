using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public interface IProjectTaskService
    {
        Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId);
        Task<List<ProjectTask>> GetAllTasksAsync();
        Task<ProjectTask> GetTaskByIdAsync(int taskId);
        Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentId); Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentId);
        Task<ProjectTask> AddSubtaskAsync(int parentTaskId, ProjectTaskCreateDto dto, string creatorId);
        Task AssignTaskAsync(int taskId, string memberId, string assignerId);
        Task<ProjectTask> UpdateTaskAsync(int id, string memberIdFromToken, ProjectTaskUpdateDto dto, bool isSupervisor);
        Task AcceptProjectTaskCompletionAsync(int id, string teamLeaderId);
        Task RejectProjectTaskCompletionAsync(int id, string teamLeaderId, string reason);

        Task AcceptTaskAssignmentAsync(int taskId, string memberId);
        Task RejectTaskAssignmentAsync(int taskId, string memberId, string reason);
        Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours);
        Task UpdateTaskProgressAsync(int taskId, string memberId, double progress);
        Task UpdateParentTaskProgressAsync(int? parentTaskId);
        Task<PaginatedResult<ProjectTask>> GetFilteredTasksAsync(ProjectTaskFilterDto filter);
            //Task AddDependencyAsync(int predecessorTaskId, int successorTaskId);
            //Task RemoveDependencyAsync(int predecessorTaskId, int successorTaskId);
            //Task<IEnumerable<ProjectTaskReadDto>> GetPredecessorsAsync(int taskId);
            //Task<IEnumerable<ProjectTaskReadDto>> GetSuccessorsAsync(int taskId);
            Task<bool> DeleteTaskAsync(int taskId);

    }
}

