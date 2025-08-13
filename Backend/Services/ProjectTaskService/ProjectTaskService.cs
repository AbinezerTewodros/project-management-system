using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Services.ProjectTaskService;
using System.Threading.Tasks;
using static ProjectManagementSystem1.Model.Entities.Milestone;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public class ProjectTaskService : IProjectTaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notification;
        private readonly IMilestoneTaskValidator _milestoneValidator;
        private readonly IMilestoneService _milestoneService;
        public ProjectTaskService(AppDbContext context, INotificationService notification,
            IMilestoneTaskValidator milestoneValidator, IMilestoneService milestoneService)
        {
            _context = context;
            _notification = notification;
            _milestoneValidator = milestoneValidator;
            _milestoneService = milestoneService;
        }

        public async Task<ProjectTask> GetTaskByIdAsync(int taskId)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .Include(t => t.TodoItems)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task != null)
            {
                await LoadSubtasksRecursively(task);
            }

            return task;
        }

        //private async Task LoadSubtasksRecursively(ProjectTask task)
        //{
        //    if (task.SubTasks != null && task.SubTasks.Any())
        //    {
        //        foreach (var subtask in task.SubTasks)
        //        {
        //            if (!_context.Entry(subtask).Collection(t => t.SubTasks).IsLoaded)
        //            {
        //                await _context.Entry(subtask).Collection(t => t.SubTasks).LoadAsync();
        //            }
        //            await LoadSubtasksRecursively(subtask);
        //        }
        //    }
        //}


        private async Task LoadSubtasksRecursively(ProjectTask task, int maxDepth = 5, int currentDepth = 0)
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

            await _notification.CreateNotificationAsync(
                    recipientUserId: assignedMemberId,
                    subject: "Task Deleted",
                    message: $"Task '{taskTitle}' has been deleted.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: taskId,
                    deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                );

            return true;
        }

        public async Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentIdOfCurrentTask)
        {
            if (!parentTaskId.HasValue) return;

            var currentTaskProjectAssignment = await _context.ProjectAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentIdOfCurrentTask);

            if (currentTaskProjectAssignment == null)
            {
                throw new InvalidOperationException($"Invalid Project Assignment ID: {projectAssignmentIdOfCurrentTask} for the current task. This assignment must exist.");
            }
            var currentTaskProjectId = currentTaskProjectAssignment.ProjectId;

            var parentTask = await _context.ProjectTasks
                .AsNoTracking()
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

            var visited = new HashSet<int> { taskId };
            var current = parentTaskId;
            int depth = 0;
            const int maxDepth = 100;

            while (current.HasValue && depth++ < maxDepth)
            {
                if (visited.Contains(current.Value))
                    throw new InvalidOperationException($"Circular reference detected at task {current.Value}");

                visited.Add(current.Value);

                var next = await _context.ProjectTasks
                    .Where(t => t.Id == current.Value)
                    .Select(t => t.ParentTaskId)
                    .FirstOrDefaultAsync();

                current = next;
            }

            if (depth >= maxDepth)
                throw new InvalidOperationException("Task hierarchy too deep or circular reference detected");
        }

        public async Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId)
        {
            if (dto.MilestoneId.HasValue)
            {
                await _milestoneValidator.ValidateMilestoneProjectConsistency(
            dto.MilestoneId, dto.ProjectAssignmentId);

                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    dto.MilestoneId, dto.StartDate, dto.DueDate);

                var milestone = await _context.Milestones
                    .Include(m => m.Project)
                    .FirstOrDefaultAsync(m => m.MilestoneId == dto.MilestoneId);

                if (milestone == null) throw new InvalidOperationException("Invalid milestone ID");

                // Verify milestone belongs to same project
                var assignment = await _context.ProjectAssignments
                    .FirstOrDefaultAsync(pa => pa.Id == dto.ProjectAssignmentId);

                if (assignment?.ProjectId != milestone.ProjectId)
                    throw new InvalidOperationException("Milestone and task must belong to same project");

                // Verify milestone start date is before task start
                if (dto.StartDate.HasValue && dto.StartDate.Value < milestone.StartDate)
                    throw new InvalidOperationException("Task cannot start before its milestone");

                if (dto.DueDate.HasValue && milestone.DueDate < dto.DueDate.Value)
                    throw new InvalidOperationException("Task cannot end after its milestone");
            }

            if (!dto.ParentTaskId.HasValue) // This is a root task
            {
                var assignment = await _context.ProjectAssignments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(pa => pa.Id == dto.ProjectAssignmentId);
                if (assignment == null)
                    throw new InvalidOperationException($"Invalid Project Assignment ID: {dto.ProjectAssignmentId} for the root task. This assignment must exist.");
            }

            var siblings = await _context.ProjectTasks
            .Where(t => t.ParentTaskId == dto.ParentTaskId)
            .SumAsync(t => t.Weight);

            if (siblings + dto.weight > 100)
                throw new InvalidOperationException("Total weight exceeds 100 for this task level");

            await ValidateParentTaskAsync(dto.ParentTaskId, dto.ProjectAssignmentId);
            await ValidateMemberAssignmentAsync(dto.AssignedMemberId, dto.ProjectAssignmentId);

            if (dto.weight < 1 || dto.weight > 100)
            {
                throw new InvalidOperationException("Weight must be between 1 and 100.");
            }

            var task = new ProjectTask
            {
                Title = dto.Title,
                Description = dto.Description,
                ProjectAssignmentId = dto.ProjectAssignmentId,
                ParentTaskId = dto.ParentTaskId,
                Weight = dto.weight,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                StartDate = dto.StartDate,
                EstimatedHours = dto.EstimatedHours,
                AssignedMemberId = dto.AssignedMemberId,
                IsProjectRoot = !dto.ParentTaskId.HasValue,
                MilestoneId = dto.MilestoneId,
                IsAutoCreateTodo = dto.IsAutoCreateTodo
            };


            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync(); // Save to generate task.Id

            // Notify the creator
            await _notification.CreateNotificationAsync(
                recipientUserId: creatorId,
                subject: "New Task Created",
                message: $"You have created task: '{task.Title}'.",
                relatedEntityType: "ProjectTask",
                relatedEntityId: task.Id,
                deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
            );
            // Notify the assigned member, if any
            if (!string.IsNullOrEmpty(task.AssignedMemberId) && task.AssignedMemberId != creatorId)
            {
                await _notification.CreateNotificationAsync(
                     recipientUserId: task.AssignedMemberId,
                     subject: "Assigned to Task",
                     message: $"You have been assigned to task: '{task.Title}'.",
                     relatedEntityType: "ProjectTask",
                     relatedEntityId: task.Id,
                     deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                 );
            }
            await UpdateParentTaskEstimatedHoursAsync(task.Id);

            // Validate circular reference after task has an ID and ParentTaskId is set
            await ValidateCircularReferenceAsync(task.Id, task.ParentTaskId);

            return task;
        }

        public async Task ValidateAssignmentRights(string assignerId, int taskId)
        {
            var task = await GetTaskByIdAsync(taskId);
            if (task.ParentTaskId.HasValue)
            {
                var parent = await GetTaskByIdAsync(task.ParentTaskId.Value);
                if (parent.AssignedMemberId != assignerId)
                    throw new UnauthorizedAccessException("Only parent task assignee can modify subtasks");
            }
        }

        private const int MaxDepth = 5;

        public async Task ValidateDepth(int? parentTaskId)
        {
            if (parentTaskId.HasValue)
            {
                var parent = await _context.ProjectTasks
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == parentTaskId);

                if (parent?.Depth >= MaxDepth)
                    throw new InvalidOperationException($"Maximum hierarchy depth of {MaxDepth} reached");
            }
        }

        public async Task<ProjectTask> AddSubtaskAsync(int parentTaskId, ProjectTaskCreateDto subtaskSpecificDto, string creatorId)
        {
            var parentTaskEntity = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment) // Needed for subtask's ProjectAssignmentId
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId)
                ?? throw new InvalidOperationException($"Parent task {parentTaskId} not found");

            if (parentTaskEntity == null)
            {
                throw new InvalidOperationException($"Parent task with ID '{parentTaskId}' not found. Cannot add subtask.");
            }

            // --- Add this check here to enforce one-level subtask hierarchy ---
            //if (parentTaskEntity.ParentTaskId.HasValue)
            //{
            //    throw new InvalidOperationException("Subtasks can only be one level deep.");
            //}
            //// --- End of added check ---

            //if (parentTaskEntity.SubTasks.Sum(st => st.Weight) + subtaskSpecificDto.weight > 100)
            //{
            //    throw new InvalidCastException($"The total weight of subtasks under parent '{parentTaskEntity.Title}' cannot exceed 100");
            //}


            var milestoneId = subtaskSpecificDto.MilestoneId ?? parentTaskEntity.MilestoneId;

            // Validate milestone dates if specified
            if (milestoneId.HasValue)
            {
                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    milestoneId,
                    subtaskSpecificDto.StartDate,
                    subtaskSpecificDto.DueDate);
            }

            if (parentTaskEntity.Depth >= 5) // Or use a constant/config value
            {
                throw new InvalidOperationException("Maximum hierarchy depth (5 levels) reached");
            }

            
            var totalWeight = parentTaskEntity.SubTasks.Sum(st => st.Weight) + subtaskSpecificDto.weight;
            if (totalWeight > 100)
                throw new InvalidOperationException($"Total weight would be {totalWeight}/100");

            var dtoForCreateCall = new ProjectTaskCreateDto
            {
                Title = subtaskSpecificDto.Title,
                Description = subtaskSpecificDto.Description,
                ProjectAssignmentId = parentTaskEntity.ProjectAssignmentId, // Inherit from parent's assignment
                AssignedMemberId = subtaskSpecificDto.AssignedMemberId,         // Use specific member for this subtask
                ParentTaskId = parentTaskId, // Explicitly set the ParentTaskId for the new subtask
                MilestoneId = subtaskSpecificDto.MilestoneId,
                weight = subtaskSpecificDto.weight,
                EstimatedHours = subtaskSpecificDto.EstimatedHours,
                DueDate = subtaskSpecificDto.DueDate,
                StartDate = subtaskSpecificDto.StartDate,
                Priority = subtaskSpecificDto.Priority
            };

            var subtaskEntity = await CreateTaskAsync(dtoForCreateCall, creatorId);

            // Notify the creator
            await _notification.CreateNotificationAsync(
                recipientUserId: creatorId,
                subject: "New Subtask Created",
                message: $"You have created subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                relatedEntityType: "ProjectTask",
                relatedEntityId: subtaskEntity.Id,
                deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
            );

            // Notify the assigned member, if any
            if (!string.IsNullOrEmpty(subtaskEntity.AssignedMemberId) && subtaskEntity.AssignedMemberId != creatorId)
            {
                await _notification.CreateNotificationAsync(
                    recipientUserId: subtaskEntity.AssignedMemberId,
                    subject: "Assigned to Subtask",
                    message: $"You have been assigned to subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: subtaskEntity.Id,
                    deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                );
            }

            if (!parentTaskEntity.SubTasks.Contains(subtaskEntity))
            {
                parentTaskEntity.SubTasks.Add(subtaskEntity);
            }
            if (subtaskEntity.ParentTask == null || subtaskEntity.ParentTask.Id != parentTaskEntity.Id)    // Link the navigation property
            {
                subtaskEntity.ParentTask = parentTaskEntity;
            }

            parentTaskEntity.UpdateHierarchy();

            // Save changes resulting from UpdateHierarchy (e.g., parent's IsLeaf, subtask's Depth).
            await _context.SaveChangesAsync();
            await SendSubtaskNotifications(parentTaskEntity, subtaskEntity, creatorId);
            await UpdateParentTaskEstimatedHoursAsync(parentTaskEntity.Id);

            return subtaskEntity;
        }

        private async Task SendSubtaskNotifications(ProjectTask parentTask, ProjectTask subtask, string creatorId)
        {
            // Notify creator
            await _notification.CreateNotificationAsync(
                recipientUserId: creatorId,
                subject: "New Subtask Created",
                message: $"You created subtask '{subtask.Title}' under '{parentTask.Title}'",
                relatedEntityType: "ProjectTask",
                relatedEntityId: subtask.Id,
                deliveryMethod: NotificationDeliveryMethod.InApp
            );

            // Notify assignee if different from creator
            if (!string.IsNullOrEmpty(subtask.AssignedMemberId))
            {
                await _notification.CreateNotificationAsync(
                    recipientUserId: subtask.AssignedMemberId,
                    subject: "New Task Assignment",
                    message: $"You've been assigned to subtask '{subtask.Title}'",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: subtask.Id,
                    deliveryMethod: NotificationDeliveryMethod.InApp
                );
            }
        }

        public async Task AssignTaskAsync(int taskId, string memberId, string assignerId)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.SubTasks) // Include subtasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            // Optionally validate if the member is assigned to the project
            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            string originalAssignee = task.AssignedMemberId;
            task.AssignedMemberId = memberId;
            await _context.SaveChangesAsync();

            if (originalAssignee != memberId)
            {
                if (!string.IsNullOrEmpty(memberId))
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: memberId,
                        subject: "Assigned to Task",
                        message: $"You have been assigned to task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: taskId,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }
                if (!string.IsNullOrEmpty(originalAssignee))
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: originalAssignee,
                        subject: "Unassigned from Task",
                        message: $"You have been unassigned from task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: taskId,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }
            }

            if (task.IsAutoCreateTodo)
            {
                // Enhancement: Automatically create a TodoItem for the assigned task with the same weight as the task
                var mainTodoItem = new TodoItem
                {
                    ProjectTaskId = taskId,
                    Title = $"Action Item for {task.Title}",
                    Weight = task.Weight, // Inherit weight from the task
                    Status = TodoItemStatus.Pending,
                    AssigneeId = memberId,
                    AssignedBy = assignerId,
                    DueDate = task.DueDate
                };

                _context.TodoItems.Add(mainTodoItem);
                await _context.SaveChangesAsync();
                await _notification.CreateNotificationAsync(
                    recipientUserId: memberId,
                    subject: "New Action Item Created",
                    message: $"A new action item has been created for you in task: '{task.Title}'.",
                    relatedEntityType: "TodoItem",
                    relatedEntityId: mainTodoItem.Id,
                    deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                );
            }

            // Enhancement: Automatically create TodoItems and assign member to subtasks as well with the same weight as the subtask
            if (task.SubTasks != null && task.SubTasks.Any())
            {
                foreach (var subtask in task.SubTasks)
                {
                    string originalSubtaskAssignee = subtask.AssignedMemberId;
                    // Assign the member to the subtask
                    
                    if (string.IsNullOrEmpty(subtask.AssignedMemberId))
                    {
                        subtask.AssignedMemberId = memberId;
                        _context.ProjectTasks.Update(subtask); // Mark subtask for update

                    }
                    
                    var subtaskTodoItem = new TodoItem
                    {
                        ProjectTaskId = subtask.Id,
                        Title = $"Action Item for {subtask.Title}",
                        Weight = subtask.Weight, // Inherit weight from the subtask
                        Status = TodoItemStatus.Pending,
                        AssignedBy = memberId,
                        DueDate = subtask.DueDate
                    };

                    _context.TodoItems.Add(subtaskTodoItem);
                    await _context.SaveChangesAsync(); // Save changes for both subtask assignment and todo item creation

                    if (originalSubtaskAssignee != memberId)
                    {
                        if (!string.IsNullOrEmpty(memberId))
                        {
                            await _notification.CreateNotificationAsync(
                                recipientUserId: memberId,
                                subject: "Assigned to Subtask",
                                message: $"You have been assigned to subtask: '{subtask.Title}' under task '{task.Title}'.",
                                relatedEntityType: "ProjectTask",
                                relatedEntityId: subtask.Id,
                                deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                            );
                        }
                        if (!string.IsNullOrEmpty(originalSubtaskAssignee))
                        {
                            await _notification.CreateNotificationAsync(
                                recipientUserId: originalSubtaskAssignee,
                                subject: "Unassigned from Subtask",
                                message: $"You have been unassigned from subtask: '{subtask.Title}' under task '{task.Title}'.",
                                relatedEntityType: "ProjectTask",
                                relatedEntityId: subtask.Id,
                                deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                            );
                        }
                    }
                    await _notification.CreateNotificationAsync(
                        recipientUserId: memberId,
                        subject: "New Action Item Created",
                        message: $"A new action item has been created for you in subtask: '{subtask.Title}' under task '{task.Title}'.",
                        relatedEntityType: "TodoItem",
                        relatedEntityId: subtaskTodoItem.Id,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }

                if (task.Status == TaskStatus.Pending)
                {
                    task.Status = TaskStatus.Accepted;
                }

                await _context.SaveChangesAsync(); // Save all subtask assignments
            }
        }

        // In ProjectTaskService.cs
        public async Task AcceptTaskAssignmentAsync(int taskId, string memberId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.Status != TaskStatus.Pending)
                throw new InvalidOperationException("Only pending tasks can be accepted");

            if (task.AssignedMemberId != memberId)
                throw new UnauthorizedAccessException("Not assigned to this task");

            task.Status = TaskStatus.Accepted;
            task.AcceptedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RejectTaskAssignmentAsync(int taskId, string memberId, string reason)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.Status != TaskStatus.Pending)
                throw new InvalidOperationException("Only pending tasks can be rejected");

            if (task.AssignedMemberId != memberId)
                throw new UnauthorizedAccessException("Not assigned to this task");

            task.Status = TaskStatus.Rejected;
            task.RejectionReason = reason;
            await _context.SaveChangesAsync();
        }

        public async Task<ProjectTask> UpdateTaskAsync(int id, string memberIdFromToken, ProjectTaskUpdateDto dto, bool isSupervisor)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
            {
                return null;
            }

            if (dto.StartDate.HasValue || dto.DueDate.HasValue)
            {
                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    task.MilestoneId,
                    dto.StartDate ?? task.StartDate,
                    dto.DueDate ?? task.DueDate);
            }

            string originalAssignedMemberId = task.AssignedMemberId;
            DateTime? originalDueDate = task.DueDate;
            //TaskStatus originalStatus = task.Status; // TaskStatus removed

            // Update properties if provided in the DTO
            if (dto.Title != null) task.Title = dto.Title;
            if (dto.Description != null) task.Description = dto.Description;
            if (dto.Weight.HasValue)
            {
                if (dto.Weight.Value < 1 || dto.Weight.Value > 100)
                    throw new InvalidOperationException("Weight must be between 1 and 100.");
                task.Weight = dto.Weight.Value;
                await UpdateParentTaskWeightAsync(id);
            }

            if (dto.DueDate.HasValue && dto.DueDate.Value != originalDueDate)
            {
                // Notify assigned member and potentially supervisor
                if (!string.IsNullOrEmpty(task.AssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: task.AssignedMemberId,
                        subject: "Task Due Date Updated",
                        message: $"The due date of task '{task.Title}' has been updated to '{dto.DueDate?.ToString("yyyy-MM-dd")}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }
                // Optionally notify supervisor
            }
            if (dto.StartDate.HasValue) task.StartDate = dto.StartDate; // Ensure this line is present
            if (dto.EstimatedHours.HasValue)
            {
                task.EstimatedHours = dto.EstimatedHours.Value;
                await UpdateParentTaskEstimatedHoursAsync(id); // Update parent on estimated hours change
            }
            if (dto.ActualHours.HasValue)
            {
                task.ActualHours = dto.ActualHours.Value;
            }
            if (dto.IsAutoCreateTodo)
            {
                task.IsAutoCreateTodo = dto.IsAutoCreateTodo;
            }
            else
            {
                task.IsAutoCreateTodo = false;
            }

            if (dto.AssignedMemberId != originalAssignedMemberId)
            {
                task.AssignedMemberId = dto.AssignedMemberId;
                // Notify the newly assigned member
                if (!string.IsNullOrEmpty(dto.AssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: dto.AssignedMemberId,
                        subject: "Assigned to Task",
                        message: $"You have been assigned to task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }
                // Optionally notify the previously assigned member
                if (!string.IsNullOrEmpty(originalAssignedMemberId))
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: originalAssignedMemberId,
                        subject: "Unassigned from Task",
                        message: $"You have been unassigned from task: '{task.Title}'.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: id,
                        deliveryMethod: NotificationDeliveryMethod.InApp // You can choose the delivery method
                    );
                }
                // Optionally notify supervisor
            }
            //if (dto.Status.HasValue) task.Status = dto.Status.Value; // Status removed
            if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;

            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            return task;
        }

        public async Task UpdateTaskProgressAsync(int taskId, string memberId, double progress)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .Include(t => t.TodoItems) // Ensure TodoItems are loaded for IsLeaf check
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

            var hasAcceptedTodo = await _context.TodoItems.AnyAsync(ti => ti.ProjectTaskId == taskId && ti.Status == TodoItemStatus.Accepted);
            if (!hasAcceptedTodo)
            {
                throw new InvalidOperationException($"Progress can only be updated for task '{task.Title}' if it has at least one accepted TodoItem.");
            }

            if (progress >= 100 && task.Status != TaskStatus.Completed)
            {
                ValidateStatusTransition(task.Status, TaskStatus.WaitingForReview, task.MilestoneId);
                task.Status = TaskStatus.WaitingForReview;
            }
            else if (progress > 0 && task.Status == TaskStatus.Pending)
            {
                task.Status = TaskStatus.InProgress;
            }

            task.Progress = progress; // This will now use the private setter with IsLeaf check
            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            await UpdateParentTaskProgressAsync(task.ParentTaskId); // Update parent progress
            if (task.ParentTaskId.HasValue)
            {
                await UpdateParentTaskWeightAsync(task.ParentTaskId.Value);
            }


        }


        public async Task UpdateParentTaskProgressAsync(int? parentTaskId)
        {
            Console.WriteLine($"UpdateParentTaskProgressAsync called with parentTaskId: {parentTaskId}");

            if (parentTaskId.HasValue)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.Milestone)
                    .Include(p => p.SubTasks)
                    .Include(p => p.TodoItems)
                    .FirstOrDefaultAsync(p => p.Id == parentTaskId);

                if (parentTask?.Milestone != null)
                {
                    var milestoneService = _context.GetService<IMilestoneService>();
                    await milestoneService.UpdateMilestoneProgress(parentTask.Milestone.MilestoneId);
                }
                if (parentTask == null)
                {
                    Console.WriteLine($"Parent task with ID {parentTaskId} not found.");
                    return;
                }

                _context.Entry(parentTask).Reload(); // Ensure we have the latest data

                if (parentTask != null)
                {
                    double totalWeight = 0;
                    double weightedProgressSum = 0;

                    if (parentTask.SubTasks.Any())
                    {
                        foreach (var subtask in parentTask.SubTasks)
                        {
                            totalWeight += subtask.Weight;
                            weightedProgressSum += subtask.Progress * subtask.Weight;
                        }
                    }

                    if (parentTask.TodoItems.Any())
                    {
                        foreach (var todoItem in parentTask.TodoItems)
                        {
                            totalWeight += todoItem.Weight;
                            weightedProgressSum += todoItem.Progress * todoItem.Weight;
                        }
                    }

                    var approvedTodos = parentTask.TodoItems.Where(t => t.Status == TodoItemStatus.Approved);
                    if (approvedTodos.Any())
                    {
                        foreach (var todoItem in approvedTodos)
                        {
                            totalWeight += todoItem.Weight;
                            weightedProgressSum += todoItem.Progress * todoItem.Weight;
                        }
                    }

                    if (totalWeight > 0)
                    {
                        parentTask.SetCalculatedProgress(weightedProgressSum / totalWeight);
                        //Console.WriteLine($"Calculated progress for parent task ID {parentTaskId}: {parentTask.Progress}");
                    }
                    else
                    {
                        parentTask.SetCalculatedProgress(0);
                    }

                    parentTask.UpdatedAt = DateTime.UtcNow;
                    _context.Entry(parentTask).State = EntityState.Modified;

                    await _context.SaveChangesAsync();

                    Console.WriteLine($"Calling UpdateParentTaskProgressAsync recursively with parentTaskId: {parentTask.ParentTaskId}");
                    await UpdateParentTaskProgressAsync(parentTask.ParentTaskId); // Recursive call
                }
            }
        }

        //private double CalculateMilestoneProgress(Milestone milestone)
        //{
        //    // Implement actual milestone progress calculation
        //    var tasks = _context.ProjectTasks
        //        .Where(t => t.MilestoneId == milestone.MilestoneId)
        //        .ToList();

        //    return tasks.Any() ? tasks.Average(t => t.Progress) : 0;
        //}

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
                }
            }
        }

        private async Task UpdateParentTaskWeightAsync(int? parentTaskId)
        {
            Console.WriteLine($"UpdateParentTaskWeightAsync called with parentTaskId: {parentTaskId}");
            if (!parentTaskId.HasValue)
            {
                Console.WriteLine("ParentTaskId is null, stopping weight update.");
                return;
            }

            var parentTask = await _context.ProjectTasks
                .Include(p => p.SubTasks)
                .Include(p => p.TodoItems)
                .FirstOrDefaultAsync(p => p.Id == parentTaskId);

            if (parentTask != null)
            {
                Console.WriteLine($"Found parent task with ID {parentTask.Id}, Title: {parentTask.Title}");

                double totalWeight = 0;

                // Sum weights of sub-ProjectTasks
                if (parentTask.SubTasks.Any())
                {
                    totalWeight += parentTask.SubTasks.Sum(sub => sub.Weight);
                    Console.WriteLine($"Total weight of sub-ProjectTasks for parent {parentTask.Id}: {parentTask.SubTasks.Sum(sub => sub.Weight)}");
                }

                // Sum weights of TodoItems
                if (parentTask.TodoItems.Any())
                {
                    totalWeight += parentTask.TodoItems.Sum(todo => todo.Weight);
                    Console.WriteLine($"Total weight of TodoItems for parent {parentTask.Id}: {parentTask.TodoItems.Sum(todo => todo.Weight)}");
                }

                Console.WriteLine($"Total combined weight for parent {parentTask.Id}: {totalWeight}");
                parentTask.Weight = Math.Min(100, (int)totalWeight); // Assuming weight is an integer
                _context.Entry(parentTask).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Continue propagating the update up the hierarchy
                Console.WriteLine($"Calling UpdateParentTaskWeightAsync recursively with parentTaskId: {parentTask.ParentTaskId}");
                await UpdateParentTaskWeightAsync(parentTask.ParentTaskId);
            }
            else
            {
                Console.WriteLine($"Parent task with ID {parentTaskId} not found.");
            }
        }

        public async Task AcceptProjectTaskCompletionAsync(int id, string teamLeaderId)
        {
            var projectTask = await _context.ProjectTasks
                .Include(t => t.ParentTask)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (projectTask == null)
            {
                throw new NotFoundException($"Project task with ID '{id}' not found.");
            }

            if (projectTask.Status == TaskStatus.WaitingForReview)
            {
                ValidateStatusTransition(projectTask.Status, TaskStatus.Completed, projectTask.MilestoneId);

                projectTask.Status = TaskStatus.Completed;
                projectTask.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _notification.CreateNotificationAsync(
                    recipientUserId: teamLeaderId, // Or the assigned member? Decide who to notify.
                    subject: "Project Task Completed",
                    message: $"Project task '{projectTask.Title}' has been accepted as completed.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: id,
                    deliveryMethod: NotificationDeliveryMethod.InApp
                );
            }
            else
            {
                throw new InvalidOperationException($"Project task with ID '{id}' is not in a state where it can be accepted for completion (Current status: {projectTask.Status}). It should be '{TaskStatus.WaitingForReview}'.");
            }
        }

        public async Task RejectProjectTaskCompletionAsync(int id, string teamLeaderId, string reason)
        {
            var projectTask = await _context.ProjectTasks.FindAsync(id);
            if (projectTask == null)
            {
                throw new NotFoundException($"Project task with ID '{id}' not found.");
            }

            if (projectTask.Status == TaskStatus.WaitingForReview)
            {
                ValidateStatusTransition(projectTask.Status, TaskStatus.InProgress, projectTask.MilestoneId);
                projectTask.Status = TaskStatus.InProgress;
                projectTask.UpdatedAt = DateTime.UtcNow;
                // Optionally store the rejection reason
                projectTask.RejectionReason = reason; // You might want to add a RejectionReason property to ProjectTask
                await _context.SaveChangesAsync();
                _notification.CreateNotificationAsync(
                    recipientUserId: teamLeaderId, // Or the assigned member? Decide who to notify.
                    subject: "Project Task Rejected",
                    message: $"Project task '{projectTask.Title}' has been rejected. Reason: {reason}",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: id,
                    deliveryMethod: NotificationDeliveryMethod.InApp
                );
            }
            else
            {
                throw new InvalidOperationException($"Project task with ID '{id}' is not in a state where it can be rejected for completion (Current status: {projectTask.Status}). It should be '{TaskStatus.WaitingForReview}'.");
            }
        }
        public Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours)
        {
            throw new NotImplementedException();
        }

        // In ProjectTaskService.cs
        public async Task<PaginatedResult<ProjectTask>> GetFilteredTasksAsync(ProjectTaskFilterDto filter)
        {
            filter.PageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
            filter.PageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);
            // Base query with includes
            var query = _context.ProjectTasks
                .Include(t => t.Milestone)
                .Include(t => t.ProjectAssignment)
                .AsNoTracking()
                .AsQueryable();

            // Apply filters in optimal order (most selective first)
            if (filter.ProjectAssignmentId.HasValue)
            {
                query = query.Where(t => t.ProjectAssignmentId == filter.ProjectAssignmentId);
            }

            if (!string.IsNullOrEmpty(filter.AssignedMemberId))
            {
                query = query.Where(t => t.AssignedMemberId == filter.AssignedMemberId);
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(t => t.Status == filter.Status.Value);
            }

            if (filter.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == filter.Priority.Value);
            }

            if (filter.Depth.HasValue)
            {
                query = query.Where(t => t.Depth == filter.Depth.Value);
            }

            if (filter.IsLeaf.HasValue)
            {
                query = query.Where(t => t.IsLeaf == filter.IsLeaf.Value);
            }

            if (filter.MilestoneId.HasValue)
            {
                query = query.Where(t => t.MilestoneId == filter.MilestoneId.Value);
            }
            // Date range filtering
            if (filter.DueDateAfter.HasValue)
            {
                query = query.Where(t => t.DueDate >= filter.DueDateAfter.Value);
            }

            if (filter.DueDateBefore.HasValue)
            {
                query = query.Where(t => t.DueDate <= filter.DueDateBefore.Value);
            }

            // Text search - optimized approach
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                // Option 1: Simple contains (works for small datasets)
                query = query.Where(t =>
                            t.Title.Contains(filter.SearchTerm) ||
                            (t.Description != null && t.Description.Contains(filter.SearchTerm))
                        );
                // Option 2: Full-text search (recommended for enterprise)
                // query = query.Where(t => EF.Functions.FreeText(t.Title, filter.SearchTerm) || 
                //                         EF.Functions.FreeText(t.Description, filter.SearchTerm));
            }

            // Count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var results = await query
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenBy(t => t.Priority)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PaginatedResult<ProjectTask>(results, totalCount, filter.PageNumber, filter.PageSize);
        }

        // Update status transitions using state machine
        private static readonly Dictionary<TaskStatus, List<TaskStatus>> ValidTransitions = new()
        {
            [TaskStatus.Pending] = new() { TaskStatus.Accepted, TaskStatus.Rejected },
            [TaskStatus.Accepted] = new() { TaskStatus.InProgress, TaskStatus.Rejected },
            [TaskStatus.InProgress] = new() { TaskStatus.WaitingForReview, TaskStatus.Rejected },
            [TaskStatus.WaitingForReview] = new() { TaskStatus.Completed, TaskStatus.InProgress },
            [TaskStatus.Completed] = new() { }, 
            [TaskStatus.Rejected] = new() { TaskStatus.InProgress }   // Reopening
        };
        public void ValidateStatusTransition(TaskStatus current, TaskStatus next, int? milestoneId)
        {
            if (milestoneId.HasValue && next == TaskStatus.Completed)
            {
                var milestone = _context.Milestones.AsNoTracking()
                    .FirstOrDefault(m => m.MilestoneId == milestoneId.Value);

                if (milestone?.Status != Milestone.MilestoneStatus.Completed)
                    throw new InvalidOperationException("Cannot complete task before milestone is completed");
            }

            if (!ValidTransitions.ContainsKey(current) || !ValidTransitions[current].Contains(next))
            {
                throw new InvalidOperationException(
                    $"Invalid transition from {current} to {next}");
            }
        
        }

        public Task ValidateHierarchyRules(int taskId, int? newParentId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ProjectTask>> GetFullHierarchy(int rootTaskId)
        {
            throw new NotImplementedException();
        }

        public Task RecalculateWeights(int parentTaskId)
        {
            throw new NotImplementedException();
        }
    }
}