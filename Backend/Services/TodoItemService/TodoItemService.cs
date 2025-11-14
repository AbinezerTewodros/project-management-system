using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Exceptions;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services.TodoItemService;
using ProjectManagementSystem1.Services.MilestoneService; // ✅ Added
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;
using BusinessNotFoundException = ProjectManagementSystem1.Model.Exceptions.NotFoundException;
using BusinessUnauthorizedAccessException = ProjectManagementSystem1.Model.Exceptions.UnauthorizedAccessException;

namespace ProjectManagementSystem1.Services.TodoItems
{
    public class TodoItemService : ITodoItemService
    {
        private readonly AppDbContext _context;
        private readonly IProjectTaskService _projectTaskService;
        private readonly IActivityLogService _activityLogService;
        private readonly IMilestoneService _milestoneService; // ✅ Added
        
        public TodoItemService(
            AppDbContext context, 
            IProjectTaskService projectTaskService, 
            IActivityLogService activityLogService,
            IMilestoneService milestoneService) // ✅ Added
        {
            _context = context;
            _projectTaskService = projectTaskService;
            _activityLogService = activityLogService;
            _milestoneService = milestoneService; // ✅ Added
        }

        public async Task<TodoItemReadDto> GetTodoItemByIdAsync(int id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            return todoItem == null ? null : MapToReadDto(todoItem);
        }

        public async Task<IEnumerable<TodoItemReadDto>> GetTodoItemsByProjectTaskIdAsync(int projectTaskId)
        {
            var todoItems = await _context.TodoItems
                .Where(ti => ti.ProjectTaskId == projectTaskId)
                .ToListAsync();
            return todoItems.Select(MapToReadDto);
        }

        public async Task<TodoItemReadDto> CreateTodoItemAsync(TodoItemCreateDto createDto, string assignerId)
        {
            var todoItem = new TodoItem
            {
                ProjectTaskId = createDto.ProjectTaskId,
                Title = createDto.Title,
                Description = createDto.Description,
                Weight = createDto.Weight,
                AssigneeId = createDto.AssignedById,
                AssignedBy = assignerId
            };

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return MapToReadDto(todoItem);
        }

        public async Task<TodoItemReadDto> UpdateTodoItemAsync(int id, TodoItemUpdateDto updateDto)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return null;
            }

            if (updateDto.Progress.HasValue && todoItem.Status != TodoItemStatus.InProgress)
            {
                throw new InvalidOperationException($"Progress can only be updated for TodoItem with ID '{id}' if it has been accepted and is in progress.");
            }

            if (updateDto.Title != null)
            {
                todoItem.Title = updateDto.Title;
            }
            if (updateDto.Description != null)
            {
                todoItem.Description = updateDto.Description;
            }
            if (updateDto.Weight.HasValue)
            {
                todoItem.Weight = updateDto.Weight.Value;
            }
            if (updateDto.Progress.HasValue)
            {
                // IMPORTANT: Progress update is allowed but does NOT affect parent task progress
                // Parent task progress will only be updated when team leader approves completion
                todoItem.Progress = updateDto.Progress.Value;
            }

            todoItem.UpdatedAt = System.DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToReadDto(todoItem);
        }

        public async Task<bool> DeleteTodoItemAsync(int id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return false;
            }

            _context.TodoItems.Remove(todoItem);
            await _context.SaveChangesAsync();
            return true;
        }



        //public async Task AcceptTodoItemAsync(int id, string memberId)
        //{
        //    var todoItem = await _context.TodoItems.FindAsync(id);

        //    if (todoItem == null)
        //    {
        //        throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
        //    }

        //    if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Rejected)
        //    {
        //        todoItem.Status = TodoItemStatus.Accepted;
        //        todoItem.AcceptedDate = DateTime.UtcNow;

        //        // Clear the rejection reason if it was rejected
        //        if (todoItem.Status == TodoItemStatus.Rejected)
        //        {
        //            todoItem.RejectionReason = null;
        //        }

        //        await _context.SaveChangesAsync();
                
        //        // IMPORTANT: Do NOT update parent task progress here
        //        // Progress will only be updated when the team leader approves completion
        //        // This ensures that accepting a task doesn't affect project progress until work is actually approved
        //    }
        //    else
        //    {
        //        throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be accepted as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.Pending}' or '{TodoItemStatus.Rejected}'.");
        //    }
        //}

        public async Task AcceptAssignmentAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
            }

            var currentStatus = todoItem.Status;

            if (currentStatus == TodoItemStatus.Pending || currentStatus == TodoItemStatus.Rejected)
            {
                todoItem.Status = TodoItemStatus.Accepted;
                todoItem.AcceptedDate = DateTime.UtcNow;

                // ✅ Check the ORIGINAL status, not the new one
                if (currentStatus == TodoItemStatus.Rejected)
                {
                    todoItem.RejectionReason = null;
                }

                await _context.SaveChangesAsync();

                await _activityLogService.LogActivityAsync(
                memberId,
                "TodoItem",
                id,
                "Accepted",
                $"Todo item '{todoItem.Title}' assignment accepted.");
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be accepted. Current status: '{currentStatus}'");
            }
        }
        public async Task AcceptTodoAfterApprovalAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
            }

            // Optional: Verify memberId matches assigned member
            if (todoItem.AssigneeId != memberId)
                throw new BusinessUnauthorizedAccessException("Approval only permitted for Team Leader");
            if (todoItem.Status == TodoItemStatus.Approved)
            {
                // This action might just set the StartDate or trigger another workflow step
                // For now, let's set the StartDate
                if (!todoItem.StartDate.HasValue)
                {
                    todoItem.StartDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    await _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Started", $"Todo item '{todoItem.Title}' started after approval.");
                }
                else
                {
                    throw new InvalidOperationException($"TodoItem with ID '{id}' has already been started after approval.");
                }
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be accepted after approval as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.Approved}'.");
            }
        }

        

        public async Task RejectAssignmentAsync(int id, string memberId, string reason)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Accepted)
            {
                todoItem.Status = TodoItemStatus.Rejected;
                todoItem.RejectionReason = reason ?? ""; // Or a dedicated RejectionReason field

                await _context.SaveChangesAsync();
                await _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Rejected", $"Assignment for todo item '{todoItem.Title}' rejected with reason: '{reason}'.");
                // Optionally, notify the assigner
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot have its assignment rejected as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.Pending}' or '{TodoItemStatus.InProgress}'.");
            }
        }

        public async Task RejectTodoAfterCompletionAsync(int id, string teamLeaderId, string reason)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.AssignedBy != teamLeaderId)
            {
                throw new BusinessUnauthorizedAccessException("Only the team leader who assigned this task can reject completion");
            }
            if (todoItem.Status != TodoItemStatus.WaitingForReview)
                throw new InvalidOperationException("Only items waiting for review can be rejected");

            if (todoItem.Status == TodoItemStatus.WaitingForReview)
            {
                // IMPORTANT: When rejecting, reset to InProgress and DON'T update project progress
                // This ensures the rejected work doesn't affect the overall project progress
                todoItem.Status = TodoItemStatus.InProgress;
                todoItem.RejectionReason = reason;
                
                // Reset progress to 0 since it was rejected
                todoItem.Progress = 0;
                todoItem.CompletionDetails = null;
                
                await _context.SaveChangesAsync();
                
                await _activityLogService.LogActivityAsync(teamLeaderId, "TodoItem", id, "Rejected", 
                    $"Todo item '{todoItem.Title}' rejected after completion with reason: '{reason}'. Progress reset to 0%.");
                
                // Note: We DON'T call UpdateProjectTaskProgress here because rejection should not affect progress
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be rejected after completion as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.WaitingForReview}'.");
            }
        }

        public async Task CompleteTodoItemAsync(int id, string memberId, int progress, string? detailsForLateCompletion, string? completionDetails)
        {
            var todoItem = await _context.TodoItems
                    .Include(t => t.ProjectTask)
                    .FirstOrDefaultAsync(t => t.Id == id);

            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");
            }

            // Verify the current user is the assignee
            if (todoItem.AssigneeId != memberId)
            {
                throw new BusinessUnauthorizedAccessException("You are not assigned to this todo item.");
            }

            if (todoItem.Status is not (TodoItemStatus.InProgress or TodoItemStatus.Reopened))
            {
                throw new InvalidOperationException("Todo must be in progress to complete");
            }

            // Validate progress
            if (progress is < 0 or > 100)
                throw new InvalidOperationException("Invalid progress value");

            if (todoItem.Status == TodoItemStatus.InProgress)
            {
                if (progress >= 0 && progress <= 100)
                {
                    // IMPORTANT: Set status to WaitingForReview but DON'T update project progress yet
                    // Progress will only be applied when Team Leader approves
                    todoItem.Status = TodoItemStatus.WaitingForReview;
                    todoItem.Progress = progress; // Store the progress for later approval
                    todoItem.CompletionDetails = completionDetails;

                    if (todoItem.DueDate.HasValue && DateTime.UtcNow > todoItem.DueDate)
                    {
                        todoItem.DetailsForLateCompletion = detailsForLateCompletion;
                    }
                    else
                    {
                        todoItem.DetailsForLateCompletion = "";
                    }

                    await _context.SaveChangesAsync();
                    
                    // Log completion but DON'T update project progress yet
                    await _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Completed", 
                        $"Todo item '{todoItem.Title}' marked as completed with progress: {progress}%. Waiting for Team Leader approval.");
                }
                else
                {
                    throw new InvalidOperationException("Progress value must be between 0 and 100.");
                }
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' is not in a state where it can be marked as completed (Current status: {todoItem.Status}).");
            }
        }

        public async Task StartTodoItemAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems
                .FirstOrDefaultAsync(t => t.Id == id); // ✅ Use FirstOrDefaultAsync for better tracking

            if (todoItem == null)
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");

            if (todoItem.AssigneeId != memberId)
                throw new BusinessUnauthorizedAccessException("You are not authorized to start this todo item.");

            // ✅ FIX: Allow both Accepted AND Reopened status
            if (todoItem.Status != TodoItemStatus.Accepted && todoItem.Status != TodoItemStatus.Reopened)
            {
                throw new InvalidOperationException(
                    $"TodoItem with ID '{id}' cannot be started. Current status: '{todoItem.Status}'. " +
                    $"Only items with status '{TodoItemStatus.Accepted}' or '{TodoItemStatus.Reopened}' can be started.");
            }

            // Check if already started (only set if not already set)
            if (!todoItem.StartDate.HasValue)
            {
                todoItem.StartDate = DateTime.UtcNow;
            }

            todoItem.Status = TodoItemStatus.InProgress;

            await _context.SaveChangesAsync();
            await _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Started",
                $"Todo item '{todoItem.Title}' started.");
        }

        public async Task DebugTodoItemStatus(int id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem != null)
            {
                Console.WriteLine($"🔍 DEBUG TodoItem {id}:");
                Console.WriteLine($"   Status: {todoItem.Status}");
                Console.WriteLine($"   AssigneeId: {todoItem.AssigneeId}");
                Console.WriteLine($"   StartDate: {todoItem.StartDate}");
                Console.WriteLine($"   AcceptedDate: {todoItem.AcceptedDate}");
                Console.WriteLine($"   Progress: {todoItem.Progress}%");
            }
            else
            {
                Console.WriteLine($"🔍 DEBUG: TodoItem {id} not found");
            }
        }

        private bool IsValidStatusTransition(TodoItemStatus current, TodoItemStatus next)
        {
            var validTransitions = new Dictionary<TodoItemStatus, List<TodoItemStatus>>
            {
                [TodoItemStatus.Pending] = new() { TodoItemStatus.Accepted, TodoItemStatus.Rejected },
                [TodoItemStatus.Accepted] = new() { TodoItemStatus.InProgress, TodoItemStatus.Rejected },
                [TodoItemStatus.Rejected] = new() { TodoItemStatus.Accepted, TodoItemStatus.InProgress },
                [TodoItemStatus.InProgress] = new() { TodoItemStatus.WaitingForReview, TodoItemStatus.Rejected },
                [TodoItemStatus.WaitingForReview] = new() { TodoItemStatus.Approved, TodoItemStatus.InProgress },
                [TodoItemStatus.Approved] = new() { },
                [TodoItemStatus.Reopened] = new() { TodoItemStatus.InProgress }
            };

            return validTransitions.ContainsKey(current) &&
                   validTransitions[current].Contains(next);
        }

        public async Task ApproveTodoItemAsync(int id, string teamLeaderId)
        {
            var todoItem = await _context.TodoItems
                .Include(t => t.ProjectTask)
                .FirstOrDefaultAsync(t => t.Id == id);
            
            if (todoItem == null)
            {
                throw new BusinessNotFoundException($"TodoItem with Id '{id}' not found.");
            }

            // Check if the team leader is the one who assigned the task
            if (todoItem.AssignedBy != teamLeaderId)
            {
                throw new BusinessUnauthorizedAccessException("Only the team leader who assigned this task can approve it");
            }

            if (todoItem.Status != TodoItemStatus.WaitingForReview)
                throw new InvalidOperationException("Only items waiting for review can be approved");

            if (todoItem.Status == TodoItemStatus.WaitingForReview)
            {
                todoItem.Status = TodoItemStatus.Approved;
                if (!todoItem.StartDate.HasValue)
                {
                    todoItem.StartDate = DateTime.UtcNow; // Ensure StartDate is set if not already
                }
                
                await _context.SaveChangesAsync();

                // NOW update the project progress since it's approved
                await UpdateProjectTaskProgressFromApprovedTodo(todoItem);

                await _activityLogService.LogActivityAsync(teamLeaderId, "TodoItem", id, "Approved", 
                    $"Todo item '{todoItem.Title}' approved with progress: {todoItem.Progress}%. Project progress updated.");
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' is not in a state where it can be approved (Current status: {todoItem.Status}).");
            }
        }

        // In TodoItemService.cs
        public async Task ReopenRejectedTodoAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
                throw new BusinessNotFoundException($"TodoItem with ID '{id}' not found.");

            if (todoItem.AssigneeId != memberId)
                throw new BusinessUnauthorizedAccessException("Only the assigned member can reopen this task");

            if (todoItem.Status != TodoItemStatus.Rejected)
                throw new InvalidOperationException("Only rejected todo items can be reopened");

            if (todoItem.AssigneeId != memberId)
                throw new BusinessUnauthorizedAccessException("Only the assigned member can reopen this todo");

            todoItem.Status = TodoItemStatus.InProgress;
            todoItem.RejectionReason = null; // Clear rejection reason
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates project task progress when a todo item is approved
        /// This is the ONLY place where progress should be updated
        /// </summary>
        private async Task UpdateProjectTaskProgressFromApprovedTodo(TodoItem approvedTodo)
        {
            var projectTask = await _context.ProjectTasks
                .Include(pt => pt.TodoItems)
                .FirstOrDefaultAsync(pt => pt.Id == approvedTodo.ProjectTaskId);

            if (projectTask != null)
            {
                // Calculate new progress based on ALL approved todos (accumulative)
                double totalWeight = projectTask.TodoItems.Sum(t => t.Weight);
                double approvedWeight = projectTask.TodoItems
                    .Where(t => t.Status == TodoItemStatus.Approved)
                    .Sum(t => t.Weight);

                // Calculate progress as percentage of approved weight vs total weight
                double newProgress = totalWeight > 0 ? (approvedWeight / totalWeight) * 100 : 0;

                // Update task progress (this adds to previous progress, doesn't replace it)
                projectTask.Progress = newProgress;

                // ✅ FIXED: Update task status based on new progress
                if (newProgress >= 100)
                {
                    projectTask.Status = TaskStatus.Completed; // ✅ All TodoItems approved = Task Completed
                    Console.WriteLine($"✅ Task {projectTask.Id} marked as COMPLETED (all TodoItems approved)");
                }
                else if (newProgress > 0 && projectTask.Status == TaskStatus.Pending)
                {
                    projectTask.Status = TaskStatus.InProgress;
                    Console.WriteLine($"🔄 Task {projectTask.Id} marked as IN PROGRESS ({newProgress:F1}%)");
                }

                await _context.SaveChangesAsync();

                // Update parent task progress if this is a subtask
                if (projectTask.ParentTaskId.HasValue)
                {
                    await _projectTaskService.UpdateParentTaskProgressAsync(projectTask.ParentTaskId);
                }

                // ✅ FIX: Update milestone progress if task belongs to a milestone
                if (projectTask.MilestoneId.HasValue)
                {
                    await _milestoneService.UpdateMilestoneProgress(projectTask.MilestoneId.Value);
                    Console.WriteLine($"✅ Updated milestone {projectTask.MilestoneId.Value} progress after task {projectTask.Id} progress changed to {newProgress:F1}%");
                }

                // Log the progress update
                await _activityLogService.LogActivityAsync(
                    approvedTodo.AssigneeId, 
                    "ProjectTask", 
                    projectTask.Id, 
                    "ProgressUpdated", 
                    $"Task progress updated to {newProgress:F1}% after approving todo '{approvedTodo.Title}' (Weight: {approvedTodo.Weight})");
            }
        }

        private TodoItemReadDto MapToReadDto(TodoItem todoItem)
        {
            return new TodoItemReadDto
            {
                Id = todoItem.Id,
                ProjectTaskId = todoItem.ProjectTaskId,
                Title = todoItem.Title,
                Description = todoItem.Description,
                Weight = todoItem.Weight,
                Progress = todoItem.Progress,
                Status = todoItem.Status,
                CreatedAt = todoItem.CreatedAt,
                UpdatedAt = todoItem.UpdatedAt,
                AssigneeId = todoItem.AssigneeId,
                AssignedBy = todoItem.AssignedBy,
                DueDate = todoItem.DueDate
            };
        }
    }
}