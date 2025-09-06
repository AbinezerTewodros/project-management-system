using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public interface ITaskAssignmentService
    {
        /// <summary>
        /// Assigns a task to a specific member
        /// </summary>
        Task AssignTaskAsync(int taskId, string memberId, string assignerId);

        /// <summary>
        /// Accepts a task assignment by the assigned member
        /// </summary>
        Task AcceptTaskAssignmentAsync(int taskId, string memberId);

        /// <summary>
        /// Rejects a task assignment by the assigned member
        /// </summary>
        Task RejectTaskAssignmentAsync(int taskId, string memberId, string reason);

        /// <summary>
        /// Updates task progress by the assigned member
        /// </summary>
        Task UpdateTaskProgressAsync(int taskId, string memberId, double progress);

        /// <summary>
        /// Updates actual hours spent on a task
        /// </summary>
        Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours);

        /// <summary>
        /// Accepts task completion by a team leader
        /// </summary>
        Task AcceptProjectTaskCompletionAsync(int id, string teamLeaderId);

        /// <summary>
        /// Rejects task completion by a team leader
        /// </summary>
        Task RejectProjectTaskCompletionAsync(int id, string teamLeaderId, string reason);
    }
}

