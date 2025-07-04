using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

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
                .Include(t => t.TodoItems)
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

            // --- Add this check here to enforce one-level subtask hierarchy ---
            if (parentTaskEntity.ParentTaskId.HasValue)
            {
                throw new InvalidOperationException("Subtasks can only be one level deep.");
            }
            // --- End of added check ---

            if (parentTaskEntity.SubTasks.Sum(st => st.Weight) + subtaskSpecificDto.weight > 100)
            {
                throw new InvalidCastException($"The total weight of subtasks under parent '{parentTaskEntity.Title}' cannot exceed 100");
            }

            var dtoForCreateCall = new ProjectTaskCreateDto
            {
                Title = subtaskSpecificDto.Title,
                Description = subtaskSpecificDto.Description,
                ProjectAssignmentId = parentTaskEntity.ProjectAssignmentId, // Inherit from parent's assignment
                AssignedMemberId = subtaskSpecificDto.AssignedMemberId,         // Use specific member for this subtask
                ParentTaskId = parentTaskId, // Explicitly set the ParentTaskId for the new subtask
                weight = subtaskSpecificDto.weight,
                EstimatedHours = subtaskSpecificDto.EstimatedHours,
                DueDate = subtaskSpecificDto.DueDate
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
            await UpdateParentTaskEstimatedHoursAsync(parentTaskEntity.Id);

            return subtaskEntity;
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
                    subtask.AssignedMemberId = memberId;
                    _context.ProjectTasks.Update(subtask); // Mark subtask for update

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
                await _context.SaveChangesAsync(); // Save all subtask assignments
            }
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
                    .Include(p => p.SubTasks)
                    .Include(p => p.TodoItems)
                    .FirstOrDefaultAsync(p => p.Id == parentTaskId);

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
                            // Reload each subtask to get the latest progress
                            _context.Entry(subtask).Reload();
                            totalWeight += subtask.Weight;
                            weightedProgressSum += subtask.Progress * subtask.Weight;
                            Console.WriteLine($"Subtask ID {subtask.Id} - Weight: {subtask.Weight}, Progress: {subtask.Progress}, Contribution: {subtask.Progress * subtask.Weight}");
                        }
                    }

                    if (parentTask.TodoItems.Any())
                    {
                        foreach (var todoItem in parentTask.TodoItems)
                        {
                            // Reload each todo item to get the latest progress
                            _context.Entry(todoItem).Reload();
                            totalWeight += todoItem.Weight;
                            weightedProgressSum += todoItem.Progress * todoItem.Weight;
                            Console.WriteLine($"TodoItem ID {todoItem.Id} - Weight: {todoItem.Weight}, Progress: {todoItem.Progress}, Contribution: {todoItem.Progress * todoItem.Weight}");
                        }
                    }

                    if (totalWeight > 0)
                    {
                        double newProgress = weightedProgressSum / totalWeight;
                        Console.WriteLine($"Calculated progress for parent task ID {parentTaskId}: {newProgress} (from {weightedProgressSum}/{totalWeight})");

                        // Only update if the progress has actually changed
                        if (Math.Abs(parentTask.Progress - newProgress) > 0.01)
                        {
                            parentTask.SetCalculatedProgress(newProgress);
                            parentTask.UpdatedAt = DateTime.UtcNow;
                            _context.Entry(parentTask).State = EntityState.Modified;
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            Console.WriteLine($"Progress for parent task ID {parentTaskId} hasn't changed significantly, skipping update.");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"No subtasks or todo items found for parent task ID {parentTaskId}, setting progress to 0");
                        parentTask.SetCalculatedProgress(0);
                        parentTask.UpdatedAt = DateTime.UtcNow;
                        _context.Entry(parentTask).State = EntityState.Modified;
                        await _context.SaveChangesAsync();
                    }

                    // Continue propagating the update up the hierarchy
                    Console.WriteLine($"Calling UpdateParentTaskProgressAsync recursively with parentTaskId: {parentTask.ParentTaskId}");

                    await UpdateParentTaskProgressAsync(parentTask.ParentTaskId); // Recursive call
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
            var projectTask = await _context.ProjectTasks.FindAsync(id);
            if (projectTask == null)
            {
                throw new NotFoundException($"Project task with ID '{id}' not found.");
            }

            if (projectTask.Status == TaskStatus.WaitingForReview)
            {
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
    }
}