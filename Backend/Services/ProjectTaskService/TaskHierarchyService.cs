using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Exceptions;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public class TaskHierarchyService : ITaskHierarchyService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TaskHierarchyService> _logger;

        public TaskHierarchyService(AppDbContext context, ILogger<TaskHierarchyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Loads subtasks recursively with depth limiting
        /// </summary>
        public async Task LoadSubtasksRecursively(ProjectTask task, int maxDepth = 5, int currentDepth = 0)
        {
            if (currentDepth >= maxDepth) return;

            await _context.Entry(task)
                .Collection(t => t.SubTasks)
                .Query()
                .Take(100) // Limit per level
                .LoadAsync();

            foreach (var subtask in task.SubTasks)
            {
                await LoadSubtasksRecursively(subtask, maxDepth, currentDepth + 1);
            }

            _logger.LogDebug("Loaded subtasks for task {TaskId} at depth {Depth}", task.Id, currentDepth);
        }

        /// <summary>
        /// Gets the full hierarchy of a task including all subtasks
        /// </summary>
        public async Task<IEnumerable<ProjectTask>> GetFullHierarchy(int rootTaskId)
        {
            var rootTask = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == rootTaskId);

            if (rootTask == null)
            {
                throw new NotFoundException("Task", rootTaskId);
            }

            var hierarchy = new List<ProjectTask> { rootTask };
            await LoadSubtasksRecursively(rootTask);

            _logger.LogInformation("Retrieved full hierarchy for task {TaskId} with {SubtaskCount} subtasks", 
                rootTaskId, rootTask.SubTasks.Count);

            return hierarchy;
        }

        /// <summary>
        /// Updates the hierarchy properties of a task
        /// </summary>
        public async Task UpdateHierarchy(ProjectTask task)
        {
            // Load the task with its parent and subtasks for proper hierarchy calculation
            var taskWithRelations = await _context.ProjectTasks
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .Include(t => t.TodoItems)
                .FirstOrDefaultAsync(t => t.Id == task.Id);

            if (taskWithRelations != null)
            {
                taskWithRelations.UpdateHierarchy();
                await _context.SaveChangesAsync();

                _logger.LogDebug("Updated hierarchy for task {TaskId}: Depth={Depth}, IsLeaf={IsLeaf}", 
                    task.Id, taskWithRelations.Depth, taskWithRelations.IsLeaf);
            }
        }

        /// <summary>
        /// Recalculates weights for all subtasks of a parent task
        /// </summary>
        public async Task RecalculateWeights(int parentTaskId)
        {
            var subtasks = await _context.ProjectTasks
                .Where(t => t.ParentTaskId == parentTaskId)
                .ToListAsync();

            if (!subtasks.Any()) return;

            var totalWeight = subtasks.Sum(t => t.Weight);
            if (totalWeight != 100)
            {
                // Normalize weights to sum to 100
                var factor = 100.0 / totalWeight;
                foreach (var subtask in subtasks)
                {
                    subtask.Weight = (int)Math.Round(subtask.Weight * factor);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Recalculated weights for {SubtaskCount} subtasks of parent task {ParentTaskId}", 
                    subtasks.Count, parentTaskId);
            }
        }

        /// <summary>
        /// Updates progress of parent tasks based on their subtasks
        /// </summary>
        public async Task UpdateParentTaskProgressAsync(int? parentTaskId)
        {
            if (!parentTaskId.HasValue) return;

            var parentTask = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId.Value);

            if (parentTask == null || !parentTask.SubTasks.Any()) return;

            // Calculate weighted average progress
            var totalWeightedProgress = parentTask.SubTasks.Sum(st => st.Progress * st.Weight);
            var totalWeight = parentTask.SubTasks.Sum(st => st.Weight);

            if (totalWeight > 0)
            {
                var newProgress = totalWeightedProgress / totalWeight;
                parentTask.SetCalculatedProgress(Math.Round(newProgress, 2));

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated parent task {ParentTaskId} progress to {Progress}% based on {SubtaskCount} subtasks", 
                    parentTaskId.Value, newProgress, parentTask.SubTasks.Count);

                // Recursively update parent's parent
                await UpdateParentTaskProgressAsync(parentTask.ParentTaskId);
            }
        }
    }
}
