using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services.TodoItemService;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.TodoItems
{
    public class TodoItemService : ITodoItemService
    {
        private readonly AppDbContext _context;
        private readonly IProjectTaskService _projectTaskService;
        private readonly IActivityLogService _activityLogService;
        public TodoItemService(AppDbContext context, IProjectTaskService projectTaskService, IActivityLogService activityLogService)
        {
            _context = context;
            _projectTaskService = projectTaskService;
            _activityLogService = activityLogService;
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
                throw new InvalidOperationException($"Progress can only be updated for TodoItem with ID '{id}' if it has been in progress.");
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



        public async Task AcceptAssignmentAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Rejected)
            {
                todoItem.Status = TodoItemStatus.Accepted;
                todoItem.AcceptedDate = DateTime.UtcNow;

                // Clear the rejection reason if it was rejected
                if (todoItem.Status == TodoItemStatus.Rejected)
                {
                    todoItem.RejectionReason = null; // Set to null or "" as needed
                }

                // Log the changes for debugging
                Console.WriteLine($"Updating TodoItem ID: {todoItem.Id}, Status: {todoItem.Status}, RejectionReason: {todoItem.RejectionReason}");

                await _context.SaveChangesAsync();
                await _projectTaskService.UpdateParentTaskProgressAsync(todoItem.ProjectTaskId);
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be accepted as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.Pending}' or '{TodoItemStatus.Rejected}'.");
            }
        }
        public async Task AcceptTodoAfterApprovalAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            // Optional: Verify memberId matches assigned member
            if (todoItem.AssigneeId != memberId)
                throw new UnauthorizedAccessException("Approval only permitted for Team Leader");
            if (todoItem.Status == TodoItemStatus.Approved)
            {
                // This action might just set the StartDate or trigger another workflow step
                // For now, let's set the StartDate
                if (!todoItem.StartDate.HasValue)
                {
                    todoItem.StartDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Started", $"Todo item '{todoItem.Title}' started after approval.");
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
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Accepted)
            {
                todoItem.Status = TodoItemStatus.Rejected;
                todoItem.RejectionReason = reason ?? ""; // Or a dedicated RejectionReason field

                await _context.SaveChangesAsync();
                _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Rejected", $"Assignment for todo item '{todoItem.Title}' rejected with reason: '{reason}'.");
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
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.AssignedBy != teamLeaderId)
            {
                throw new UnauthorizedAccessException("Only the team leader who assigned this task can reject completion");
            }
            if (todoItem.Status != TodoItemStatus.WaitingForReview)
                throw new InvalidOperationException("Only items waiting for review can be rejected");

            if (todoItem.Status == TodoItemStatus.WaitingForReview) // Allow rejection even after approval
            {
                todoItem.Status = TodoItemStatus.Rejected;
                todoItem.RejectionReason = reason; // Or a dedicated RejectionReason field
                await _context.SaveChangesAsync();
                _activityLogService.LogActivityAsync(teamLeaderId, "TodoItem", id, "Rejected", $"Todo item '{todoItem.Title}' rejected after completion with reason: '{reason}'.");
                // Notify the member
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be rejected after completion as its current status is '{todoItem.Status}'. It should be '{TodoItemStatus.WaitingForReview}' or '{TodoItemStatus.Approved}'.");
            }
        }

        public async Task CompleteTodoItemAsync(int id, string memberId, int progress, string? detailsForLateCompletion, string? completionDetails)
        {
            var todoItem = await _context.TodoItems
                    .Include(t => t.ProjectTask)
                    .FirstOrDefaultAsync(t => t.Id == id);

            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            // Verify the current user is the assignee
            if (todoItem.AssigneeId != memberId)
            {
                throw new UnauthorizedAccessException("You are not assigned to this todo item.");
            }

            if (todoItem.Status is not (TodoItemStatus.InProgress or TodoItemStatus.Reopened))
            {
                throw new InvalidOperationException("Todo must be in progress to complete");
            }

            // Validate progress
            if (progress is < 0 or > 100)
                throw new InvalidOperationException("Invalid progress value");


            if (todoItem.Status == TodoItemStatus.InProgress )
            {
                if (progress >= 0 && progress <= 100)
                {
                    todoItem.Status = TodoItemStatus.WaitingForReview;
                    todoItem.Progress = progress; // Set the progress


                    if (todoItem.Status == TodoItemStatus.InProgress)
                    {
                        todoItem.CompletionDetails = completionDetails;
                        await _context.SaveChangesAsync();
                    }

                    if (todoItem.DueDate.HasValue && DateTime.UtcNow > todoItem.DueDate)
                    {
                        todoItem.DetailsForLateCompletion = detailsForLateCompletion;
                        //todoItem.CompletionDetails = "";

                    }
                    else
                    {
                        todoItem.DetailsForLateCompletion = "";
                        //todoItem.CompletionDetails = completionDetails;

                    }

                   

                    await _context.SaveChangesAsync();
                    await _projectTaskService.UpdateParentTaskProgressAsync(todoItem.ProjectTaskId);
                    _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Completed", $"Todo item '{todoItem.Title}' marked as completed with progress: {progress}%.");

                    var projectTask = await _context.ProjectTasks
                        .Include(pt => pt.TodoItems)
                        .FirstOrDefaultAsync(pt => pt.Id == todoItem.ProjectTaskId);

                    
                    if (projectTask != null)
                    {
                        // Calculate new progress based on all todos
                        double totalWeight = projectTask.TodoItems.Sum(t => t.Weight);
                        double completedWeight = projectTask.TodoItems
                            .Where(t => t.Status == TodoItemStatus.Approved)
                            .Sum(t => t.Weight);

                        double newProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

                        // Update task progress and status
                        projectTask.Progress = newProgress;

                        if (newProgress >= 100)
                        {
                            projectTask.Status = TaskStatus.WaitingForReview;
                        }
                        else if (newProgress > 0 && projectTask.Status == TaskStatus.Pending)
                        {
                            projectTask.Status = TaskStatus.InProgress;
                        }

                        await _context.SaveChangesAsync();
                        await _projectTaskService.UpdateParentTaskProgressAsync(projectTask.ParentTaskId);
                    }
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
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            // Optional: Check if the memberId matches the assigned member
            if (todoItem.AssigneeId != memberId)
            {
                throw new UnauthorizedAccessException("You are not authorized to start this todo item.");
            }

            if (todoItem.Status == TodoItemStatus.Accepted)
            {
                todoItem.Status = TodoItemStatus.InProgress;
                todoItem.StartDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _activityLogService.LogActivityAsync(memberId, "TodoItem", id, "Started", $"Todo item '{todoItem.Title}' started.");
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' cannot be started. Current status: '{todoItem.Status}', Start Date already set: '{todoItem.StartDate.HasValue}'.");
            }
        }

        public async Task ApproveTodoItemAsync(int id, string teamLeaderId)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            
            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with Id '{id}' not found.");
            }

            if (todoItem.AssigneeId != teamLeaderId)
            {
                throw new UnauthorizedAccessException("Only team leaders or task assigners can approve");
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

                _activityLogService.LogActivityAsync(teamLeaderId, "TodoItem", id, "Approved", $"Todo item '{todoItem.Title}' approved.");
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
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");

            if (todoItem.AssigneeId != memberId)
                throw new UnauthorizedAccessException("Only the assigned member can reopen this task");

            if (todoItem.Status != TodoItemStatus.Rejected)
                throw new InvalidOperationException("Only rejected todo items can be reopened");

            if (todoItem.AssigneeId != memberId)
                throw new UnauthorizedAccessException("Only the assigned member can reopen this todo");

            todoItem.Status = TodoItemStatus.InProgress;
            todoItem.RejectionReason = null; // Clear rejection reason
            await _context.SaveChangesAsync();
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