namespace ProjectManagementSystem1.Services.Caching
{
    /// <summary>
    /// Service for managing cache invalidation based on entity changes.
    /// </summary>
    public interface ICacheInvalidationService
    {
        /// <summary>
        /// Invalidates cache entries for a specific entity type.
        /// </summary>
        /// <param name="entityType">Type of entity (e.g., "Project", "Task")</param>
        Task InvalidateEntityTypeAsync(string entityType);

        /// <summary>
        /// Invalidates cache entries for a specific entity by ID.
        /// </summary>
        /// <param name="entityType">Type of entity</param>
        /// <param name="entityId">Entity ID</param>
        Task InvalidateEntityAsync(string entityType, object entityId);

        /// <summary>
        /// Invalidates cache entries for a specific user.
        /// </summary>
        /// <param name="userId">User ID</param>
        Task InvalidateUserAsync(string userId);

        /// <summary>
        /// Invalidates cache entries for a specific project.
        /// </summary>
        /// <param name="projectId">Project ID</param>
        Task InvalidateProjectAsync(int projectId);

        /// <summary>
        /// Invalidates cache entries for a specific task.
        /// </summary>
        /// <param name="taskId">Task ID</param>
        Task InvalidateTaskAsync(int taskId);

        /// <summary>
        /// Invalidates all cache entries.
        /// </summary>
        Task InvalidateAllAsync();

        /// <summary>
        /// Invalidates cache entries matching a specific pattern.
        /// </summary>
        /// <param name="pattern">Pattern to match (supports wildcards)</param>
        Task InvalidateByPatternAsync(string pattern);
    }
}

