using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public interface ITaskValidationService
    {
        /// <summary>
        /// Validates that a parent task exists and belongs to the same project assignment
        /// </summary>
        Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentIdOfCurrentTask);

        /// <summary>
        /// Validates that a member exists and can be assigned to tasks in the project
        /// </summary>
        Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentIdOfTask);

        /// <summary>
        /// Validates that the assigner has rights to assign the task
        /// </summary>
        Task ValidateAssignmentRights(string assignerId, int taskId);

        /// <summary>
        /// Validates that the task hierarchy depth is within acceptable limits
        /// </summary>
        Task ValidateDepth(int? parentTaskId);

        /// <summary>
        /// Validates hierarchy rules when changing a task's parent
        /// </summary>
        Task ValidateHierarchyRules(int taskId, int? newParentId);
    }
}

