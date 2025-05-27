using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IProjectTaskService
    {
        Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId);
        Task<List<ProjectTask>> GetAllTasksAsync();
        Task<ProjectTask> GetTaskByIdAsync(int taskId);
        Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentId);
        Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentId);
        Task<ProjectTask> AddSubtaskAsync(int parentTaskId, ProjectTaskCreateDto dto, string creatorId);
        Task AssignTaskAsync(int taskId, string memberId);
        Task<ProjectTask> UpdateTaskAsync(int id, string memberIdFromToken, ProjectTaskUpdateDto dto, bool isSupervisor);
        Task AcceptTaskAsync(int taskId, string memeberId);
        Task RejectTaskAsync(int taskId, string memberId, string reason);
        Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours);
        Task UpdateTaskProgressAsync(int taskId, string memberId, double progress);
        Task<bool> DeleteTaskAsync(int taskId);

    }
}

