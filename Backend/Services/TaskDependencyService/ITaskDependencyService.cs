using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.TaskDependencyService
{
    public interface ITaskDependencyService
    {
        Task<TaskDependency> CreateDependencyAsync(int predecessorTaskId, int successorTaskId, DependencyType dependencyType, int? lagDays, string description, string createdByUserId);
        Task<bool> RemoveDependencyAsync(int dependencyId);
        Task<IEnumerable<TaskDependency>> GetDependenciesForTaskAsync(int taskId);
        Task<IEnumerable<ProjectTask>> GetPredecessorsAsync(int taskId);
        Task<IEnumerable<ProjectTask>> GetSuccessorsAsync(int taskId);
        Task<bool> ValidateDependencyAsync(int predecessorTaskId, int successorTaskId);
        Task<bool> HasCircularDependencyAsync(int predecessorTaskId, int successorTaskId);
        Task<IEnumerable<ProjectTask>> GetBlockedTasksAsync(int taskId);
        Task UpdateTaskDatesBasedOnDependenciesAsync(int taskId);
    }
}
