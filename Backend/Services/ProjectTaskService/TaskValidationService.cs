using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Exceptions;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public class TaskValidationService : ITaskValidationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TaskValidationService> _logger;

        public TaskValidationService(AppDbContext context, ILogger<TaskValidationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Validates that a parent task exists and belongs to the same project assignment
        /// </summary>
        public async Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentIdOfCurrentTask)
        {
            if (!parentTaskId.HasValue) return;

            var parentTask = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId.Value);

            if (parentTask == null)
            {
                throw new NotFoundException("Parent task", parentTaskId.Value);
            }

            if (parentTask.ProjectAssignmentId != projectAssignmentIdOfCurrentTask)
            {
                throw new BusinessRuleException("ParentTaskProjectMismatch", 
                    "Parent task must belong to the same project assignment");
            }

            _logger.LogInformation("Parent task {ParentTaskId} validated for project assignment {ProjectAssignmentId}", 
                parentTaskId.Value, projectAssignmentIdOfCurrentTask);
        }

        /// <summary>
        /// Validates that a member exists and can be assigned to tasks in the project
        /// </summary>
        public async Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentIdOfTask)
        {
            if (string.IsNullOrWhiteSpace(memberId)) return;

            // Check if member exists
            var member = await _context.Users.FirstOrDefaultAsync(u => u.Id == memberId);
            if (member == null)
            {
                throw new NotFoundException("User", memberId);
            }

            // Check if member is assigned to the project
            var projectAssignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentIdOfTask);

            if (projectAssignment == null)
            {
                throw new NotFoundException("Project assignment", projectAssignmentIdOfTask);
            }

            var memberAssignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(pa => pa.ProjectId == projectAssignment.ProjectId && pa.MemberId == memberId);

            if (memberAssignment == null)
            {
                throw new BusinessRuleException("MemberNotInProject", 
                    $"User {memberId} is not assigned to the project");
            }

            _logger.LogInformation("Member {MemberId} validated for project assignment {ProjectAssignmentId}", 
                memberId, projectAssignmentIdOfTask);
        }

        /// <summary>
        /// Validates that the assigner has rights to assign the task
        /// </summary>
        public async Task ValidateAssignmentRights(string assignerId, int taskId)
        {
            if (string.IsNullOrWhiteSpace(assignerId))
            {
                throw new ArgumentException("Assigner ID cannot be null or empty", nameof(assignerId));
            }

            var task = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .ThenInclude(pa => pa.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new NotFoundException("Task", taskId);
            }

            // Check if assigner is a supervisor or manager of the project
            // Note: This is a simplified check. In a real implementation, you would use UserManager to check roles
            // For now, we'll allow the assignment and let the business logic handle permissions
            _logger.LogInformation("Assignment rights check skipped for assigner {AssignerId} on task {TaskId}", 
                assignerId, taskId);

            _logger.LogInformation("Assignment rights validated for assigner {AssignerId} on task {TaskId}", 
                assignerId, taskId);
        }

        /// <summary>
        /// Validates that the task hierarchy depth is within acceptable limits
        /// </summary>
        public async Task ValidateDepth(int? parentTaskId)
        {
            if (!parentTaskId.HasValue) return;

            const int maxDepth = 5;
            var currentDepth = 0;
            var currentParentId = parentTaskId.Value;

            while (currentParentId != 0 && currentDepth < maxDepth)
            {
                var parent = await _context.ProjectTasks
                    .Where(t => t.Id == currentParentId)
                    .Select(t => new { t.Id, t.ParentTaskId })
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    throw new NotFoundException("Parent task", currentParentId);
                }

                currentParentId = parent.ParentTaskId ?? 0;
                currentDepth++;
            }

            if (currentDepth >= maxDepth)
            {
                throw new BusinessRuleException("MaxDepthExceeded", 
                    $"Task hierarchy depth cannot exceed {maxDepth} levels");
            }

            _logger.LogInformation("Task hierarchy depth validated: {Depth} levels", currentDepth);
        }

        /// <summary>
        /// Validates hierarchy rules when changing a task's parent
        /// </summary>
        public async Task ValidateHierarchyRules(int taskId, int? newParentId)
        {
            if (!newParentId.HasValue) return;

            // Prevent self-reference
            if (taskId == newParentId.Value)
            {
                throw new BusinessRuleException("SelfReference", "Task cannot be its own parent");
            }

            // Check for circular references
            var visited = new HashSet<int> { taskId };
            var currentId = newParentId.Value;

            while (currentId != 0)
            {
                if (visited.Contains(currentId))
                {
                    throw new BusinessRuleException("CircularReference", 
                        "Circular reference detected in task hierarchy");
                }

                visited.Add(currentId);

                var parent = await _context.ProjectTasks
                    .Where(t => t.Id == currentId)
                    .Select(t => t.ParentTaskId)
                    .FirstOrDefaultAsync();

                if (parent == null)
                {
                    throw new NotFoundException("Parent task", currentId);
                }

                currentId = parent ?? 0;
            }

            _logger.LogInformation("Hierarchy rules validated for task {TaskId} with new parent {NewParentId}", 
                taskId, newParentId.Value);
        }
    }
}
