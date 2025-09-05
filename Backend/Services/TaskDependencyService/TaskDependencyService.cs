using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.TaskDependencyService;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.TaskDependencyService
{
    public class TaskDependencyService : ITaskDependencyService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TaskDependencyService> _logger;

        public TaskDependencyService(AppDbContext context, ILogger<TaskDependencyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TaskDependency> CreateDependencyAsync(int predecessorTaskId, int successorTaskId, DependencyType dependencyType, int? lagDays, string description, string createdByUserId)
        {
            // Validate that both tasks exist
            var predecessor = await _context.ProjectTasks.FindAsync(predecessorTaskId);
            var successor = await _context.ProjectTasks.FindAsync(successorTaskId);

            if (predecessor == null || successor == null)
                throw new ArgumentException("One or both tasks not found");

            // Check for circular dependencies
            if (await HasCircularDependencyAsync(predecessorTaskId, successorTaskId))
                throw new InvalidOperationException("Circular dependency detected");

            // Check if dependency already exists
            var existingDependency = await _context.TaskDependencies
                .FirstOrDefaultAsync(d => d.PredecessorTaskId == predecessorTaskId && d.SuccessorTaskId == successorTaskId);

            if (existingDependency != null)
                throw new InvalidOperationException("Dependency already exists");

            var dependency = new TaskDependency
            {
                PredecessorTaskId = predecessorTaskId,
                SuccessorTaskId = successorTaskId,
                DependencyType = dependencyType,
                LagDays = lagDays,
                Description = description,
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskDependencies.Add(dependency);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created dependency between task {PredecessorId} and {SuccessorId}", predecessorTaskId, successorTaskId);
            return dependency;
        }

        public async Task<bool> RemoveDependencyAsync(int dependencyId)
        {
            var dependency = await _context.TaskDependencies.FindAsync(dependencyId);
            if (dependency == null)
                return false;

            _context.TaskDependencies.Remove(dependency);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed dependency {DependencyId}", dependencyId);
            return true;
        }

        public async Task<IEnumerable<TaskDependency>> GetDependenciesForTaskAsync(int taskId)
        {
            return await _context.TaskDependencies
                .Include(d => d.PredecessorTask)
                .Include(d => d.SuccessorTask)
                .Where(d => d.PredecessorTaskId == taskId || d.SuccessorTaskId == taskId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetPredecessorsAsync(int taskId)
        {
            var predecessorIds = await _context.TaskDependencies
                .Where(d => d.SuccessorTaskId == taskId)
                .Select(d => d.PredecessorTaskId)
                .ToListAsync();

            return await _context.ProjectTasks
                .Where(t => predecessorIds.Contains(t.Id))
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetSuccessorsAsync(int taskId)
        {
            var successorIds = await _context.TaskDependencies
                .Where(d => d.PredecessorTaskId == taskId)
                .Select(d => d.SuccessorTaskId)
                .ToListAsync();

            return await _context.ProjectTasks
                .Where(t => successorIds.Contains(t.Id))
                .ToListAsync();
        }

        public async Task<bool> ValidateDependencyAsync(int predecessorTaskId, int successorTaskId)
        {
            // Check if both tasks exist
            var predecessor = await _context.ProjectTasks.FindAsync(predecessorTaskId);
            var successor = await _context.ProjectTasks.FindAsync(successorTaskId);

            if (predecessor == null || successor == null)
                return false;

            // Check if they belong to the same project assignment
            if (predecessor.ProjectAssignmentId != successor.ProjectAssignmentId)
                return false;

            // Check for circular dependencies
            if (await HasCircularDependencyAsync(predecessorTaskId, successorTaskId))
                return false;

            return true;
        }

        public async Task<bool> HasCircularDependencyAsync(int predecessorTaskId, int successorTaskId)
        {
            // Use depth-first search to detect cycles
            var visited = new HashSet<int>();
            var recursionStack = new HashSet<int>();

            return await HasCycleDFSAsync(successorTaskId, visited, recursionStack);
        }

        private async Task<bool> HasCycleDFSAsync(int taskId, HashSet<int> visited, HashSet<int> recursionStack)
        {
            if (recursionStack.Contains(taskId))
                return true; // Cycle detected

            if (visited.Contains(taskId))
                return false; // Already processed

            visited.Add(taskId);
            recursionStack.Add(taskId);

            // Get all successors of current task
            var successors = await _context.TaskDependencies
                .Where(d => d.PredecessorTaskId == taskId)
                .Select(d => d.SuccessorTaskId)
                .ToListAsync();

            foreach (var successorId in successors)
            {
                if (await HasCycleDFSAsync(successorId, visited, recursionStack))
                    return true;
            }

            recursionStack.Remove(taskId);
            return false;
        }

        public async Task<IEnumerable<ProjectTask>> GetBlockedTasksAsync(int taskId)
        {
            var blockedTasks = new List<ProjectTask>();
            var visited = new HashSet<int>();

            await GetBlockedTasksRecursiveAsync(taskId, blockedTasks, visited);
            return blockedTasks;
        }

        private async Task GetBlockedTasksRecursiveAsync(int taskId, List<ProjectTask> blockedTasks, HashSet<int> visited)
        {
            if (visited.Contains(taskId))
                return;

            visited.Add(taskId);

            // Get all successors
            var successors = await _context.TaskDependencies
                .Include(d => d.SuccessorTask)
                .Where(d => d.PredecessorTaskId == taskId)
                .ToListAsync();

            foreach (var dependency in successors)
            {
                var successor = dependency.SuccessorTask;
                
                // Check if successor is blocked by this dependency
                if (IsTaskBlockedByDependency(successor, dependency))
                {
                    blockedTasks.Add(successor);
                }

                // Recursively check successors
                await GetBlockedTasksRecursiveAsync(successor.Id, blockedTasks, visited);
            }
        }

        private bool IsTaskBlockedByDependency(ProjectTask task, TaskDependency dependency)
        {
            switch (dependency.DependencyType)
            {
                case DependencyType.FinishToStart:
                    return task.Status == TaskStatus.Pending && 
                           dependency.PredecessorTask.Status != TaskStatus.Completed;
                
                case DependencyType.StartToStart:
                    return task.Status == TaskStatus.Pending && 
                           dependency.PredecessorTask.Status == TaskStatus.Pending;
                
                case DependencyType.FinishToFinish:
                    return task.Status != TaskStatus.Completed && 
                           dependency.PredecessorTask.Status != TaskStatus.Completed;
                
                case DependencyType.StartToFinish:
                    return task.Status != TaskStatus.Completed && 
                           dependency.PredecessorTask.Status == TaskStatus.Pending;
                
                default:
                    return false;
            }
        }

        public async Task UpdateTaskDatesBasedOnDependenciesAsync(int taskId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) return;

            var predecessors = await GetPredecessorsAsync(taskId);
            if (!predecessors.Any()) return;

            var dependencies = await _context.TaskDependencies
                .Where(d => d.SuccessorTaskId == taskId)
                .ToListAsync();

            DateTime? earliestStartDate = null;
            DateTime? earliestFinishDate = null;

            foreach (var dependency in dependencies)
            {
                var predecessor = predecessors.First(p => p.Id == dependency.PredecessorTaskId);
                var lagDays = dependency.LagDays ?? 0;

                switch (dependency.DependencyType)
                {
                    case DependencyType.FinishToStart:
                        if (predecessor.DueDate.HasValue)
                        {
                            var newStartDate = predecessor.DueDate.Value.AddDays(lagDays);
                            if (!earliestStartDate.HasValue || newStartDate > earliestStartDate.Value)
                                earliestStartDate = newStartDate;
                        }
                        break;

                    case DependencyType.StartToStart:
                        if (predecessor.StartDate.HasValue)
                        {
                            var newStartDate = predecessor.StartDate.Value.AddDays(lagDays);
                            if (!earliestStartDate.HasValue || newStartDate > earliestStartDate.Value)
                                earliestStartDate = newStartDate;
                        }
                        break;

                    case DependencyType.FinishToFinish:
                        if (predecessor.DueDate.HasValue)
                        {
                            var newFinishDate = predecessor.DueDate.Value.AddDays(lagDays);
                            if (!earliestFinishDate.HasValue || newFinishDate > earliestFinishDate.Value)
                                earliestFinishDate = newFinishDate;
                        }
                        break;

                    case DependencyType.StartToFinish:
                        if (predecessor.StartDate.HasValue)
                        {
                            var newFinishDate = predecessor.StartDate.Value.AddDays(lagDays);
                            if (!earliestFinishDate.HasValue || newFinishDate > earliestFinishDate.Value)
                                earliestFinishDate = newFinishDate;
                        }
                        break;
                }
            }

            // Update task dates
            if (earliestStartDate.HasValue && (!task.StartDate.HasValue || earliestStartDate.Value > task.StartDate.Value))
            {
                task.StartDate = earliestStartDate.Value;
            }

            if (earliestFinishDate.HasValue && (!task.DueDate.HasValue || earliestFinishDate.Value > task.DueDate.Value))
            {
                task.DueDate = earliestFinishDate.Value;
            }

            await _context.SaveChangesAsync();
        }
    }
}
