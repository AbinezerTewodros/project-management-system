using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public interface ITaskHierarchyService
    {
        /// <summary>
        /// Loads subtasks recursively with depth limiting
        /// </summary>
        Task LoadSubtasksRecursively(ProjectTask task, int maxDepth = 5, int currentDepth = 0);

        /// <summary>
        /// Gets the full hierarchy of a task including all subtasks
        /// </summary>
        Task<IEnumerable<ProjectTask>> GetFullHierarchy(int rootTaskId);

        /// <summary>
        /// Updates the hierarchy properties of a task
        /// </summary>
        Task UpdateHierarchy(ProjectTask task);

        /// <summary>
        /// Recalculates weights for all subtasks of a parent task
        /// </summary>
        Task RecalculateWeights(int parentTaskId);

        /// <summary>
        /// Updates progress of parent tasks based on their subtasks
        /// </summary>
        Task UpdateParentTaskProgressAsync(int? parentTaskId);
    }
}

