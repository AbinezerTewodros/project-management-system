using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
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
        public TodoItemService(AppDbContext context, IProjectTaskService projectTaskService)
        {
            _context = context;
            _projectTaskService = projectTaskService;
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

        public async Task<TodoItemReadDto> CreateTodoItemAsync(TodoItemCreateDto createDto)
        {
            var todoItem = new TodoItem
            {
                ProjectTaskId = createDto.ProjectTaskId,
                Title = createDto.Title,
                Description = createDto.Description,
                Weight = createDto.Weight
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

            if (updateDto.Progress.HasValue && todoItem.Status != TodoItemStatus.Accepted)
            {
                throw new InvalidOperationException($"Progress can only be updated for TodoItem with ID '{id}' if it has been accepted.");
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

        public async Task AcceptTodoItemAsync(int id, string memberId)
        {
            var todoItem = await _context.TodoItems
                            .Include(ti => ti.ProjectTask)
                            .FirstOrDefaultAsync(ti => ti.Id == id);

            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Rejected)
            {
                todoItem.Status = TodoItemStatus.Accepted;
                await _context.SaveChangesAsync();
                await _projectTaskService.UpdateParentTaskProgressAsync(todoItem.ProjectTaskId);

                if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Rejected)
                {
                    todoItem.Status = TodoItemStatus.Accepted;
                    await _context.SaveChangesAsync();
                    await _projectTaskService.UpdateParentTaskProgressAsync(todoItem.ProjectTaskId);

                    // Update parent ProjectTask status
                    if (todoItem.ProjectTask != null)
                    {
                        var projectTask = await _context.ProjectTasks
                            .Include(pt => pt.TodoItems)
                            .FirstOrDefaultAsync(pt => pt.Id == todoItem.ProjectTaskId);

                        if (projectTask != null)
                        {
                            if (projectTask.TodoItems.Any(ti => ti.Status == TodoItemStatus.Accepted))
                            {
                                projectTask.Status = TaskStatus.Accepted;
                            }
                            else if (projectTask.TodoItems.All(ti => ti.Status == TodoItemStatus.Pending || ti.Status == TodoItemStatus.Rejected))
                            {
                                projectTask.Status = TaskStatus.Pending;
                            }
                            // You can add more conditions here for other statuses like Completed or Rejected of the ProjectTask
                            await _context.SaveChangesAsync();
                        }
                    }
                }
                // Enhancement: If the parent task has subtasks and the user is assigned, accept their todo items too
                if (todoItem.ProjectTask?.SubTasks != null && todoItem.ProjectTask.SubTasks.Any() && todoItem.ProjectTask.AssignedMemberId == memberId)
                {
                    foreach (var subtask in todoItem.ProjectTask.SubTasks)
                    {
                        var subtaskTodo = await _context.TodoItems
                            .FirstOrDefaultAsync(sti => sti.ProjectTaskId == subtask.Id && sti.ProjectTask.AssignedMemberId == memberId);
                        if (subtaskTodo != null && (subtaskTodo.Status == TodoItemStatus.Pending || subtaskTodo.Status == TodoItemStatus.Rejected))
                        {
                            subtaskTodo.Status = TodoItemStatus.Accepted;
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' is not in a Pending or Rejected state and cannot be accepted.");
            }
        }
        public async Task RejectTodoItemAsync(int id, string memberId, string reason)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                throw new NotFoundException($"TodoItem with ID '{id}' not found.");
            }

            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new InvalidOperationException("Rejection reason is required.");
            }

            if (todoItem.Status == TodoItemStatus.Pending || todoItem.Status == TodoItemStatus.Accepted)
            {
                todoItem.Status = TodoItemStatus.Rejected;
                // Optionally store the reason somewhere if needed
                await _context.SaveChangesAsync();
                await _projectTaskService.UpdateParentTaskProgressAsync(todoItem.ProjectTaskId); // Update parent progress
            }
            else
            {
                throw new InvalidOperationException($"TodoItem with ID '{id}' is not in a Pending or Accepted state and cannot be rejected.");
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
                UpdatedAt = todoItem.UpdatedAt
            };
        }
    }
}
