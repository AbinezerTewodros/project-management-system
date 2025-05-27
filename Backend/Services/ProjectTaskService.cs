using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus; // Keep this specific using alias

namespace ProjectManagementSystem1.Services
{
    public class ProjectTaskService : IProjectTaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notification;
        public ProjectTaskService(AppDbContext context, INotificationService notification)
        {
            _context = context;
            _notification = notification;
        }

        public async Task<ProjectTask> GetTaskByIdAsync(int taskId)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task != null)
            {
                await LoadSubtasksRecursively(task);
            }

            return task;
        }

        private async Task LoadSubtasksRecursively(ProjectTask task)
        {
            if (task.SubTasks != null && task.SubTasks.Any())
            {
                foreach (var subtask in task.SubTasks)
                {
                    if (!_context.Entry(subtask).Collection(t => t.SubTasks).IsLoaded)
                    {
                        await _context.Entry(subtask).Collection(t => t.SubTasks).LoadAsync();
                    }

                    await LoadSubtasksRecursively(subtask);
                }
            }
        }

        public async Task<List<ProjectTask>> GetAllTasksAsync()
        {
            return await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .ToListAsync();
        }

        public async Task<bool> DeleteTaskAsync(int taskId)
        {
            var taskToDelete = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (taskToDelete == null)
            {
                return false;
            }

            string assignedMemberId = taskToDelete.AssignedMemberId;
            string taskTitle = taskToDelete.Title;


            if (taskToDelete.SubTasks.Any())
            {
                foreach (var subtask in taskToDelete.SubTasks.ToList())
                {
                    await DeleteTaskAsync(subtask.Id);
                }
            }

            _context.ProjectTasks.Remove(taskToDelete);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(assignedMemberId))
            {
                await _notification.CreateNotificationAsync(
                    userId: assignedMemberId,
                    message: $"Task '{taskTitle}' has been decommleted.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: taskId
                );
                // Optionally notify the supervisor or creator
            }

            return true;
        }

        public async Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentIdOfCurrentTask)
        {
            if (!parentTaskId.HasValue) return;

            // Get current task's project ID from its assignment
            var currentTaskProjectAssignment = await _context.ProjectAssignments
                .AsNoTracking() // No need to track for validation
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentIdOfCurrentTask);

            if (currentTaskProjectAssignment == null)
            {
                throw new InvalidOperationException($"Invalid Project Assignment ID: {projectAssignmentIdOfCurrentTask} for the current task. This assignment must exist.");
            }
            var currentTaskProjectId = currentTaskProjectAssignment.ProjectId;

            var parentTask = await _context.ProjectTasks
                .AsNoTracking() // No need to track for validation
                .Include(t => t.ProjectAssignment)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId.Value);

            if (parentTask == null)
                throw new InvalidOperationException($"Parent task with ID '{parentTaskId.Value}' not found.");

            if (parentTask.ProjectAssignment == null)
                throw new InvalidOperationException($"Project assignment for parent task (ID: {parentTask.Id}) is missing. Cannot validate project consistency.");

            var parentTaskProjectId = parentTask.ProjectAssignment.ProjectId;

            if (parentTaskProjectId != currentTaskProjectId)
                throw new InvalidOperationException($"Parent task (ID: {parentTaskId.Value}, Project: {parentTaskProjectId}) must belong to the same project as the current task (Project: {currentTaskProjectId}).");
        }

        public async Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentIdOfTask)
        {
            var trimmedMemberId = memberId?.Trim();
            if (string.IsNullOrEmpty(trimmedMemberId)) return;

            var taskProjectAssignment = await _context.ProjectAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentIdOfTask);

            if (taskProjectAssignment == null)
            {
                throw new InvalidOperationException($"Invalid Project Assignment ID: {projectAssignmentIdOfTask} for the task. Cannot validate member assignment.");
            }
            var projectIdForTask = taskProjectAssignment.ProjectId;

            bool isMemberAssignedToProject = await _context.ProjectAssignments
                .AsNoTracking()
                .AnyAsync(pa => pa.ProjectId == projectIdForTask && pa.MemberId == trimmedMemberId);

            if (!isMemberAssignedToProject)
                throw new InvalidOperationException($"Member with ID '{trimmedMemberId}' is not assigned to project ID '{projectIdForTask}'.");
        }

        private async Task ValidateCircularReferenceAsync(int taskId, int? parentTaskId)
        {
            if (!parentTaskId.HasValue) return;

            var visitedIds = new HashSet<int> { taskId };
            int? currentAncestorId = parentTaskId;

            while (currentAncestorId != null)
            {
                if (visitedIds.Contains(currentAncestorId.Value))
                    throw new InvalidOperationException($"Circular task hierarchy detected. Task ID '{taskId}' cannot have an ancestor (ID: {currentAncestorId.Value}) that is itself or one of its descendants.");

                visitedIds.Add(currentAncestorId.Value);

                var ancestorTask = await _context.ProjectTasks
                    .AsNoTracking()
                    .Select(t => new { t.Id, t.ParentTaskId }) // Select only what's needed
                    .FirstOrDefaultAsync(t => t.Id == currentAncestorId.Value);

                currentAncestorId = ancestorTask?.ParentTaskId;
            }
        }

        public async Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId)
        {
            if (!dto.ParentTaskId.HasValue) // This is a root task
            {
                var assignment = await _context.ProjectAssignments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(pa => pa.Id == dto.ProjectAssignmentId);
                if (assignment == null)
                    throw new InvalidOperationException($"Invalid Project Assignment ID: {dto.ProjectAssignmentId} for the root task. This assignment must exist.");
            }

            await ValidateParentTaskAsync(dto.ParentTaskId, dto.ProjectAssignmentId);
            await ValidateMemberAssignmentAsync(dto.AssignedMemberId, dto.ProjectAssignmentId);

            var task = new ProjectTask
            {
                Title = dto.Title,
                Description = dto.Description, // Added description mapping
                ProjectAssignmentId = dto.ProjectAssignmentId,
                ParentTaskId = dto.ParentTaskId,
                Weight = dto.weight, // Assuming ProjectTaskCreateDto.weight maps to ProjectTask.Weight
                Priority = dto.Priority,
                //ProjectGoal = dto.ProjectGoalId,
                DueDate = dto.DueDate,
                EstimatedHours = dto.EstimatedHours,
                AssignedMemberId = dto.AssignedMemberId
                // EF Core by convention will set ProjectAssignment if ProjectAssignmentId is set,
                // and ParentTask if ParentTaskId is set, assuming the related entities are tracked or loaded.
                // Initial Depth (0) and IsLeaf (true) are fine for new tasks. UpdateHierarchy will adjust later if it becomes a parent/subtask.
            };

            
            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync(); // Save to generate task.Id

            // Notify the creator
            await _notification.CreateNotificationAsync(
                userId: creatorId,
                message: $"You have created task: '{task.Title}'.",
                relatedEntityType: "ProjectTask",
                relatedEntityId: task.Id
            );

            // Notify the assigned member, if any
            if (!string.IsNullOrEmpty(task.AssignedMemberId) && task.AssignedMemberId != creatorId)
            {
                await _notification.CreateNotificationAsync(
                    userId: task.AssignedMemberId,
                    message: $"You have been assigned to task: '{task.Title}'.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: task.Id
                );
            }
            await UpdateParentTaskEstimatedHoursAsync(task.Id);

            // Validate circular reference after task has an ID and ParentTaskId is set
            await ValidateCircularReferenceAsync(task.Id, task.ParentTaskId);

            // If it's a subtask, its hierarchy (Depth, parent's IsLeaf) will be updated by AddSubtaskAsync.
            // If it's a root task, its initial Depth (0) and IsLeaf (true) are correct.
            // If a root task needs its ParentTask explicitly set to null (it is by default for int?), it's fine.
            // No need to call UpdateHierarchy here as its state is initially correct or will be handled by AddSubtaskAsync.

            return task;
        }


        public async Task<ProjectTask> AddSubtaskAsync(int parentTaskId, ProjectTaskCreateDto subtaskSpecificDto, string creatorId)
        {
            var parentTaskEntity = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment) // Needed for subtask's ProjectAssignmentId
                .Include(t => t.ParentTask) 
                .Include(t => t.SubTasks) 
                .FirstOrDefaultAsync(t => t.Id == parentTaskId);

            if (parentTaskEntity == null)
            {
                throw new InvalidOperationException($"Parent task with ID '{parentTaskId}' not found. Cannot add subtask.");
            }

            Console.WriteLine($"Before CreateTaskAsync - Parent Task ID: {parentTaskEntity.Id}, Depth: {parentTaskEntity.Depth}");

            var dtoForCreateCall = new ProjectTaskCreateDto
            {
                Title = subtaskSpecificDto.Title,
                Description = subtaskSpecificDto.Description,
                ProjectAssignmentId = parentTaskEntity.ProjectAssignmentId, // Inherit from parent's assignment
                AssignedMemberId = subtaskSpecificDto.AssignedMemberId,    // Use specific member for this subtask
                ParentTaskId = parentTaskId, // Explicitly set the ParentTaskId for the new subtask
                weight = subtaskSpecificDto.weight,
                EstimatedHours = subtaskSpecificDto.EstimatedHours,
                //Priority = subtaskSpecificDto.Priority,
                DueDate = subtaskSpecificDto.DueDate
            };

            // CreateTaskAsync will validate, create, add to context, and save the new subtask.
            var subtaskEntity = await CreateTaskAsync(dtoForCreateCall, creatorId);

            // Notify the creator
            await _notification.CreateNotificationAsync(
                userId: creatorId,
                message: $"You have created subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                relatedEntityType: "ProjectTask",
                relatedEntityId: subtaskEntity.Id
            );

            // Notify the assigned member, if any
            if (!string.IsNullOrEmpty(subtaskEntity.AssignedMemberId) && subtaskEntity.AssignedMemberId != creatorId)
            {
                await _notification.CreateNotificationAsync(
                    userId: subtaskEntity.AssignedMemberId,
                    message: $"You have been assigned to subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: subtaskEntity.Id
                );
            }

            if (!parentTaskEntity.SubTasks.Contains(subtaskEntity))
            {
                parentTaskEntity.SubTasks.Add(subtaskEntity);
            }
            if (subtaskEntity.ParentTask == null || subtaskEntity.ParentTask.Id != parentTaskEntity.Id)  // Link the navigation property
            {
                subtaskEntity.ParentTask = parentTaskEntity;
            }

            parentTaskEntity.UpdateHierarchy();

            // Save changes resulting from UpdateHierarchy (e.g., parent's IsLeaf, subtask's Depth).
            await _context.SaveChangesAsync();
            await UpdateParentTaskEstimatedHoursAsync(parentTaskEntity.Id);

            return subtaskEntity;
        }

        public async Task AssignTaskAsync(int taskId, string memberId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            // Optionally validate if the member is assigned to the project
            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            task.AssignedMemberId = memberId;
            await _context.SaveChangesAsync();

            await _notification.CreateNotificationAsync(
                userId: memberId,
                message: $"You have been assigned to task: '{task.Title}'.",
                relatedEntityType: "ProjectTask",
                relatedEntityId: taskId
                );
        }

        public async Task<ProjectTask> UpdateTaskAsync(int id, string memberIdFromToken, ProjectTaskUpdateDto dto, bool isSupervisor)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
            {
                return null;
            }

            string originalAssignedMemberId = task.AssignedMemberId;
            DateTime? originalDueDate = task.DueDate;
            TaskStatus originalStatus = task.Status;

            // Update properties if provided in the DTO
            if (dto.Title != null)
            {
                task.Title = dto.Title;
            }
            if (dto.Description != null)
            {
                task.Description = dto.Description;
            }
            if (dto.Weight.HasValue)
            {
                task.Weight = dto.Weight.Value;
                await UpdateParentTaskWeightAsync(id);
            }
           
            if (dto.DueDate.HasValue)
            {
                task.DueDate = dto.DueDate;
            }
            if (dto.EstimatedHours.HasValue)
            {
                task.EstimatedHours = dto.EstimatedHours.Value;
                await UpdateParentTaskEstimatedHoursAsync(id); // Update parent on estimated hours change
            }
            if (dto.AssignedMemberId != null)
            {
                task.AssignedMemberId = dto.AssignedMemberId;
            }
            if (dto.Status.HasValue)
            {
                task.Status = dto.Status.Value;
            }
            if (dto.Priority.HasValue)
            {
                task.Priority = dto.Priority.Value;
            }
                        
            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            // Send notifications based on changes
            if (dto.Status.HasValue && dto.Status.Value != originalStatus)
            {
                // Notify assigned member and potentially supervisor
                if (!string.IsNullOrEmpty(task.AssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        userId: task.AssignedMemberId,
                        message: $"The status of task '{task.Title}' has been updated to '{dto.Status.Value}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id
                    );
                }
                // Optionally notify supervisor
            }

            if (dto.DueDate.HasValue && dto.DueDate.Value != originalDueDate)
            {
                // Notify assigned member and potentially supervisor
                if (!string.IsNullOrEmpty(task.AssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        userId: task.AssignedMemberId,
                        message: $"The due date of task '{task.Title}' has been updated to '{dto.DueDate?.ToString("yyyy-MM-dd")}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id
                    );
                }
                // Optionally notify supervisor
            }

            if (dto.AssignedMemberId != null && dto.AssignedMemberId != originalAssignedMemberId)
            {
                // Notify the newly assigned member
                if (!string.IsNullOrEmpty(task.AssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        userId: task.AssignedMemberId,
                        message: $"You have been assigned to task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id
                    );
                }
                // Optionally notify the previously assigned member
                if (!string.IsNullOrEmpty(originalAssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        userId: originalAssignedMemberId,
                        message: $"You have been unassigned from task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id
                    );
                }
                // Optionally notify supervisor
            }

            return task;
        }

        public async Task AcceptTaskAsync(int taskId, string memberId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            if (task.AssignedMemberId != memberId)
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not assigned to member ID '{memberId}'.");
            }

            if (task.Status == TaskStatus.Pending || task.Status == TaskStatus.Rejected)
            {
                task.Status = TaskStatus.Accepted;
                task.RejectionReason = null;
                await _context.SaveChangesAsync();

                await _notification.CreateNotificationAsync(
                   userId: memberId,
                   message: $"You have accepted task: '{task.Title}'.",
                   relatedEntityType: "ProjectTask",
                   relatedEntityId: taskId
               );
            }
            else
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not in a Pending state and cannot be accepted.");
            }


        }

        public async Task RejectTaskAsync(int taskId, string memberId, string reason)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            if (task.AssignedMemberId != memberId)
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not assigned to member ID '{memberId}'.");
            }

            if (task.Status == TaskStatus.Pending || task.Status == TaskStatus.Accepted)
            {
                task.Status = TaskStatus.Rejected;
                task.RejectionReason = reason;
                await _context.SaveChangesAsync();

                await _notification.CreateNotificationAsync(
                    userId: memberId,
                    message: $"You have rejected task: '{task.Title}' with reason.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: taskId
                );
            }
            else
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not in a Pending state and cannot be rejected.");
            }
        }

        public async Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
                throw new NotFoundException($"Task with ID '{taskId} not found.");

            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            if (task.AssignedMemberId != memberId)
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not assigned to member ID '{memberId}.");
            }

            task.ActualHours = actualHours;
            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateTaskProgressAsync(int taskId, string memberId, double progress)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            if (task.AssignedMemberId != memberId)
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not assigned to member ID '{memberId}'.");
            }

            if (!task.IsLeaf)
            {
                throw new InvalidOperationException("Progress can only be updated for leaf tasks.");
            }

            task.Progress = progress;
            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            await UpdateParentTaskProgressAsync(task.ParentTaskId); // Update parent progress
        }

        private async Task UpdateParentTaskProgressAsync(int? parentTaskId)
        {

            if (parentTaskId.HasValue)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.SubTasks)
                    .FirstOrDefaultAsync(p => p.Id == parentTaskId);

                _context.Entry(parentTask).Reload();

                if (parentTask != null)
                {
                    if (parentTask.SubTasks.Any())
                    {
                        double totalWeight = parentTask.SubTasks.Sum(st => st.Weight);
                        if (totalWeight > 0)
                        {
                            double weightedProgressSum = parentTask.SubTasks.Sum(st => st.Progress * st.Weight);
                            parentTask.Progress = weightedProgressSum / totalWeight;
                         }
                        else
                        {
                            parentTask.Progress = 0;
                        }

                        //parentTask.Progress = parentTask.SubTasks.Average(st => st.Progress);
                        parentTask.UpdatedAt = DateTime.UtcNow;
                        _context.ProjectTasks.Update(parentTask);

                        await _context.SaveChangesAsync();

                        await UpdateParentTaskProgressAsync(parentTask.ParentTaskId); // Recursive update
                    }
                }
            }
        }
        private async Task UpdateParentTaskEstimatedHoursAsync(int taskId)
        {
            var task = await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task?.ParentTaskId.HasValue == true)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.SubTasks)
                    .FirstOrDefaultAsync(p => p.Id == task.ParentTaskId);

                if (parentTask != null)
                {
                    double totalEstimatedHours = parentTask.SubTasks.Sum(sub => sub.EstimatedHours);
                    parentTask.EstimatedHours = totalEstimatedHours;
                    _context.ProjectTasks.Update(parentTask);
                    await _context.SaveChangesAsync();

                    // Optionally, you could propagate this update further up the hierarchy
                    // if your requirements dictate immediate consistency across all levels.
                    // However, for better performance, you might defer such full updates.
                }
            }

        }

        private async Task UpdateParentTaskWeightAsync(int taskId)
        {
            var task = await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task?.ParentTaskId.HasValue == true)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.SubTasks)
                    .FirstOrDefaultAsync(p => p.Id == task.ParentTaskId);

                if (parentTask != null)
                {
                    double totalWeight = parentTask.SubTasks.Sum(sub => sub.Weight);
                    parentTask.Weight = (int)totalWeight; // Assuming weight is an integer
                    _context.ProjectTasks.Update(parentTask);
                    await _context.SaveChangesAsync();

                    // Continue propagating the update up the hierarchy
                    await UpdateParentTaskWeightAsync(parentTask.Id);
                }
            }
        }
    }
}

