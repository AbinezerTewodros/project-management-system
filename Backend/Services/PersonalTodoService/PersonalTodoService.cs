using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.PersonalTodoDto;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public class PersonalTodoService : IPersonalTodoService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PersonalTodoService> _logger;
        private readonly IActivityLogService _activityLogService;

        public PersonalTodoService(AppDbContext context, ILogger<PersonalTodoService> logger, IActivityLogService activityLogService)
        {
            _context = context;
            _logger = logger;
            _activityLogService = activityLogService;
        }

        public async Task<PersonalTodoReadDto> GetPersonalTodoByIdAsync(int id)
        {
            var todo = await _context.PersonalTodo.FindAsync(id);
            return todo != null ? MapToReadDto(todo) : null;
        }

        public async Task<IEnumerable<PersonalTodoReadDto>> GetAllPersonalTodosAsync()
        {
            var todos = await _context.PersonalTodo.ToListAsync();
            return todos.Select(MapToReadDto);
        }

        public async Task<IEnumerable<PersonalTodoReadDto>> GetPersonalTodosByUserAsync(string userId)
        {
            var todos = await _context.PersonalTodo
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();
            
            return todos.Select(MapToReadDto);
        }

        public async Task<IEnumerable<PersonalTodoReadDto>> GetPersonalTodosByUserWithFiltersAsync(
            string userId, 
            PersonalTodoStatus? status = null, 
            PersonalTodoPriority? priority = null, 
            bool? isOverdue = null,
            string? tags = null)
        {
            var query = _context.PersonalTodo.Where(t => t.UserId == userId);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (priority.HasValue)
                query = query.Where(t => t.Priority == priority.Value);

            if (isOverdue.HasValue)
            {
                if (isOverdue.Value)
                    query = query.Where(t => t.DueDate.HasValue && DateTime.UtcNow > t.DueDate.Value && !t.IsCompleted);
                else
                    query = query.Where(t => !t.DueDate.HasValue || DateTime.UtcNow <= t.DueDate.Value || t.IsCompleted);
            }

            if (!string.IsNullOrEmpty(tags))
            {
                var tagList = tags.Split(',').Select(t => t.Trim()).ToList();
                query = query.Where(t => t.Tags != null && tagList.Any(tag => t.Tags.Contains(tag)));
            }

            var todos = await query
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();

            return todos.Select(MapToReadDto);
        }

        public async Task<IEnumerable<PersonalTodoReadDto>> GetOverdueTodosAsync(string userId)
        {
            // First update overdue status for all todos
            await UpdateOverdueStatusAsync();
            
            var todos = await _context.PersonalTodo
                .Where(t => t.UserId == userId && 
                           t.DueDate.HasValue && 
                           DateTime.UtcNow > t.DueDate.Value && 
                           !t.IsCompleted)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();

            return todos.Select(MapToReadDto);
        }

        public async Task<IEnumerable<PersonalTodoReadDto>> GetTodosNeedingRemindersAsync(string userId)
        {
            var todos = await _context.PersonalTodo
                .Where(t => t.UserId == userId && 
                           t.EnableReminders && 
                           t.DueDate.HasValue && 
                           !t.IsCompleted &&
                           t.ReminderHoursBeforeDue.HasValue &&
                           (!t.LastReminderSent.HasValue || 
                            t.LastReminderSent.Value.AddHours(t.ReminderHoursBeforeDue.Value) <= DateTime.UtcNow))
                .ToListAsync();

            return todos.Select(MapToReadDto);
        }

        public async Task<PersonalTodoReadDto> CreatePersonalTodoAsync(PersonalTodoCreateDto createDto, string userId)
        {
            var todo = new PersonalTodo
            {
                UserId = userId,
                Task = createDto.Task,
                Description = createDto.Description,
                DueDate = createDto.DueDate,
                Priority = createDto.Priority,
                EnableReminders = createDto.EnableReminders,
                ReminderHoursBeforeDue = createDto.ReminderHoursBeforeDue,
                Tags = createDto.Tags,
                Notes = createDto.Notes,
                IsRecurring = createDto.IsRecurring,
                RecurrencePattern = createDto.RecurrencePattern,
                Status = PersonalTodoStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.PersonalTodo.Add(todo);
            await _context.SaveChangesAsync();

            // Log the creation activity
            await _activityLogService.LogActivityAsync(
                userId: userId,
                entityType: "PersonalTodo",
                entityId: todo.TodoId,
                actionType: "Created",
                details: $"Personal todo '{todo.Task}' created with priority {todo.Priority}"
            );

            _logger.LogInformation("Created personal todo {TodoId} for user {UserId}", todo.TodoId, userId);
            return MapToReadDto(todo);
        }

        public async Task<PersonalTodoReadDto> UpdatePersonalTodoAsync(int id, PersonalTodoUpdateDto updateDto, string userId)
        {
            var existingTodo = await _context.PersonalTodo.FindAsync(id);
            if (existingTodo == null)
            {
                return null;
            }

            // Verify ownership
            if (existingTodo.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only update your own todos");
            }

            // Update fields if provided
            if (updateDto.Task != null)
                existingTodo.Task = updateDto.Task;

            if (updateDto.Description != null)
                existingTodo.Description = updateDto.Description;

            if (updateDto.Progress.HasValue)
            {
                existingTodo.Progress = updateDto.Progress.Value;
                
                // Update status based on progress
                if (updateDto.Progress.Value == 0 && existingTodo.Status == PersonalTodoStatus.Pending)
                {
                    // No change needed
                    // Progress already set above, no need to set again
                }
                else if (updateDto.Progress.Value > 0 && existingTodo.Status == PersonalTodoStatus.Pending)
                {
                    existingTodo.Status = PersonalTodoStatus.InProgress;
                   
                }
                else if (updateDto.Progress.Value == 100 && existingTodo.Status != PersonalTodoStatus.Completed)
                {
                    existingTodo.Status = PersonalTodoStatus.Completed;
                    existingTodo.CompletedDate = DateTime.UtcNow;
                }
            }

            if (updateDto.IsCompleted.HasValue)
            {
                existingTodo.IsCompleted = updateDto.IsCompleted.Value;
                if (updateDto.IsCompleted.Value)
                {
                    existingTodo.Status = PersonalTodoStatus.Completed;
                    existingTodo.CompletedDate = DateTime.UtcNow;
                    existingTodo.Progress = updateDto.Progress ?? existingTodo.Progress;
                }
                else if (existingTodo.Status == PersonalTodoStatus.Completed)
                {
                    existingTodo.Status = PersonalTodoStatus.InProgress;
                    existingTodo.CompletedDate = null;
                }
            }

            if (updateDto.DueDate.HasValue)
                existingTodo.DueDate = updateDto.DueDate.Value;

            if (updateDto.StartDate.HasValue)
                existingTodo.StartDate = updateDto.StartDate.Value;

            if (updateDto.Priority.HasValue)
                existingTodo.Priority = updateDto.Priority.Value;

            if (updateDto.Status.HasValue)
                existingTodo.Status = updateDto.Status.Value;

            if (updateDto.EnableReminders.HasValue)
                existingTodo.EnableReminders = updateDto.EnableReminders.Value;

            if (updateDto.ReminderHoursBeforeDue.HasValue)
                existingTodo.ReminderHoursBeforeDue = updateDto.ReminderHoursBeforeDue.Value;

            if (updateDto.EnableEmailReminders.HasValue)
                existingTodo.EnableEmailReminders = updateDto.EnableEmailReminders.Value;

            if (updateDto.EnablePushNotifications.HasValue)
                existingTodo.EnablePushNotifications = updateDto.EnablePushNotifications.Value;

            if (updateDto.EnableSmsReminders.HasValue)
                existingTodo.EnableSmsReminders = updateDto.EnableSmsReminders.Value;

            if (updateDto.Tags != null)
                existingTodo.Tags = updateDto.Tags;

            if (updateDto.Notes != null)
                existingTodo.Notes = updateDto.Notes;

            if (updateDto.IsRecurring.HasValue)
                existingTodo.IsRecurring = updateDto.IsRecurring.Value;

            if (updateDto.RecurrencePattern != null)
                existingTodo.RecurrencePattern = updateDto.RecurrencePattern;



            // Update overdue status
            if (existingTodo.DueDate.HasValue && DateTime.UtcNow > existingTodo.DueDate.Value && !existingTodo.IsCompleted)
            {
                existingTodo.Status = PersonalTodoStatus.Overdue;
            }

            existingTodo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log the update activity
            await _activityLogService.LogActivityAsync(
                userId: userId,
                entityType: "PersonalTodo",
                entityId: id,
                actionType: "Updated",
                details: $"Personal todo '{existingTodo.Task}' updated"
            );

            _logger.LogInformation("Updated personal todo {TodoId} for user {UserId}", id, userId);
            return MapToReadDto(existingTodo);
        }

        public async Task<bool> DeletePersonalTodoAsync(int id, string userId)
        {
            var todo = await _context.PersonalTodo.FindAsync(id);
            if (todo == null)
            {
                return false;
            }

            // Verify ownership
            if (todo.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only delete your own todos");
            }

            _context.PersonalTodo.Remove(todo);
            await _context.SaveChangesAsync();

            // Log the deletion activity
            await _activityLogService.LogActivityAsync(
                userId: userId,
                entityType: "PersonalTodo",
                entityId: id,
                actionType: "Deleted",
                details: $"Personal todo '{todo.Task}' deleted"
            );

            _logger.LogInformation("Deleted personal todo {TodoId} for user {UserId}", id, userId);
            return true;
        }

        public async Task<PersonalTodoReadDto> StartTodoAsync(int id, string userId)
        {
            var todo = await _context.PersonalTodo.FindAsync(id);
            if (todo == null)
            {
                return null;
            }

            if (todo.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only start your own todos");
            }

            if (todo.Status == PersonalTodoStatus.Pending)
            {
                todo.Status = PersonalTodoStatus.InProgress;
                todo.StartDate = DateTime.UtcNow;
                todo.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Started personal todo {TodoId} for user {UserId}", id, userId);
            }

            return MapToReadDto(todo);
        }

        public async Task<PersonalTodoReadDto> CompleteTodoAsync(int id, string userId)
        {
            var todo = await _context.PersonalTodo.FindAsync(id);
            if (todo == null)
            {
                return null;
            }

            if (todo.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only complete your own todos");
            }

            todo.IsCompleted = true;
            todo.Status = PersonalTodoStatus.Completed;
            todo.Progress = 100;
            todo.CompletedDate = DateTime.UtcNow;
            todo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log the completion activity
            await _activityLogService.LogActivityAsync(
                userId: userId,
                entityType: "PersonalTodo",
                entityId: id,
                actionType: "Completed",
                details: $"Personal todo '{todo.Task}' completed"
            );

            _logger.LogInformation("Completed personal todo {TodoId} for user {UserId}", id, userId);

            // If this is a recurring todo, create the next occurrence
            PersonalTodoReadDto nextRecurringTodo = null;
            if (todo.IsRecurring && !string.IsNullOrEmpty(todo.RecurrencePattern))
            {
                try
                {
                    nextRecurringTodo = await CreateNextRecurringTodoAsync(id);
                    _logger.LogInformation("Created next recurring todo {NextTodoId} for completed todo {CompletedTodoId}", 
                        nextRecurringTodo.TodoId, id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create next recurring todo for completed todo {TodoId}", id);
                }
            }

            return MapToReadDto(todo);
        }

        public async Task<PersonalTodoReadDto> UpdateProgressAsync(int id, int progress, string userId)
        {
            if (progress < 0 || progress > 100)
            {
                throw new ArgumentException("Progress must be between 0 and 100");
            }

            var todo = await _context.PersonalTodo.FindAsync(id);
            if (todo == null)
            {
                return null;
            }

            if (todo.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only update your own todos");
            }

            todo.Progress = progress;

            // Update status based on progress
            if (progress == 0 && todo.Status == PersonalTodoStatus.Pending)
            {
                // No change needed
            }
            else if (progress > 0 && todo.Status == PersonalTodoStatus.Pending)
            {
                todo.Status = PersonalTodoStatus.InProgress;
                todo.StartDate ??= DateTime.UtcNow;
            }
            else if (progress == 100 && todo.Status != PersonalTodoStatus.Completed)
            {
                todo.Status = PersonalTodoStatus.Completed;
                todo.IsCompleted = true;
                todo.CompletedDate = DateTime.UtcNow;
            }

            todo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated progress to {Progress}% for personal todo {TodoId} by user {UserId}", progress, id, userId);
            return MapToReadDto(todo);
        }

        public async Task MarkReminderSentAsync(int id)
        {
            var todo = await _context.PersonalTodo.FindAsync(id);
            if (todo != null)
            {
                todo.LastReminderSent = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateOverdueStatusAsync()
        {
            var overdueTodos = await _context.PersonalTodo
                .Where(t => t.DueDate.HasValue && 
                           DateTime.UtcNow > t.DueDate.Value && 
                           !t.IsCompleted && 
                           t.Status != PersonalTodoStatus.Overdue)
                .ToListAsync();

            foreach (var todo in overdueTodos)
            {
                todo.Status = PersonalTodoStatus.Overdue;
                todo.UpdatedAt = DateTime.UtcNow;
            }

            if (overdueTodos.Any())
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated {Count} todos to overdue status", overdueTodos.Count);
            }
        }

        public async Task<PersonalTodoReadDto> CreateNextRecurringTodoAsync(int completedTodoId)
        {
            var completedTodo = await _context.PersonalTodo.FindAsync(completedTodoId);
            if (completedTodo == null || !completedTodo.IsRecurring || string.IsNullOrEmpty(completedTodo.RecurrencePattern))
            {
                throw new InvalidOperationException("Todo is not recurring or pattern is not defined");
            }

            var nextDueDate = CalculateNextDueDate(completedTodo.DueDate.Value, completedTodo.RecurrencePattern);
            
            var newTodo = new PersonalTodo
            {
                UserId = completedTodo.UserId,
                Task = completedTodo.Task,
                Description = completedTodo.Description,
                IsCompleted = false,
                Progress = 0,
                CreatedAt = DateTime.UtcNow,
                DueDate = nextDueDate,
                Priority = completedTodo.Priority,
                Status = PersonalTodoStatus.Pending,
                EnableReminders = completedTodo.EnableReminders,
                ReminderHoursBeforeDue = completedTodo.ReminderHoursBeforeDue,
                Tags = completedTodo.Tags,
                Notes = completedTodo.Notes,
                IsRecurring = true,
                RecurrencePattern = completedTodo.RecurrencePattern
            };

            _context.PersonalTodo.Add(newTodo);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created next recurring todo {NewTodoId} from completed todo {CompletedTodoId}", 
                newTodo.TodoId, completedTodoId);

            return MapToReadDto(newTodo);
        }

        private DateTime CalculateNextDueDate(DateTime currentDueDate, string recurrencePattern)
        {
            return recurrencePattern.ToLower() switch
            {
                "daily" => currentDueDate.AddDays(1),
                "weekly" => currentDueDate.AddDays(7),
                "monthly" => currentDueDate.AddMonths(1),
                "yearly" => currentDueDate.AddYears(1),
                _ => currentDueDate.AddDays(1) // Default to daily
            };
        }

        public async Task<IEnumerable<PersonalTodo>> GetTodosNeedingRemindersAsync()
        {
            return await _context.PersonalTodo
                .Where(t => t.EnableReminders && 
                           t.DueDate.HasValue && 
                           t.ReminderHoursBeforeDue.HasValue &&
                           !t.IsCompleted &&
                           (t.EnableEmailReminders || t.EnablePushNotifications || t.EnableSmsReminders) &&
                           (!t.LastReminderSent.HasValue || 
                            t.LastReminderSent.Value.AddHours(t.ReminderHoursBeforeDue.Value) <= DateTime.UtcNow))
                .ToListAsync();
        }

        public async Task<IEnumerable<PersonalTodo>> GetTodosNeedingRemindersByTypeAsync(string userId, string notificationType)
        {
            var query = _context.PersonalTodo
                .Where(t => t.UserId == userId &&
                           t.EnableReminders && 
                           t.DueDate.HasValue && 
                           t.ReminderHoursBeforeDue.HasValue &&
                           !t.IsCompleted &&
                           (!t.LastReminderSent.HasValue || 
                            t.LastReminderSent.Value.AddHours(t.ReminderHoursBeforeDue.Value) <= DateTime.UtcNow));

            // Filter by notification type
            query = notificationType.ToLower() switch
            {
                "email" => query.Where(t => t.EnableEmailReminders),
                "push" => query.Where(t => t.EnablePushNotifications),
                "sms" => query.Where(t => t.EnableSmsReminders),
                _ => query
            };

            return await query.ToListAsync();
        }

        public async Task UpdateNotificationPreferencesAsync(int todoId, string userId, bool? enableEmail = null, bool? enablePush = null, bool? enableSms = null)
        {
            var todo = await _context.PersonalTodo.FindAsync(todoId);
            if (todo == null || todo.UserId != userId)
            {
                throw new UnauthorizedAccessException("Todo not found or access denied");
            }

            if (enableEmail.HasValue) todo.EnableEmailReminders = enableEmail.Value;
            if (enablePush.HasValue) todo.EnablePushNotifications = enablePush.Value;
            if (enableSms.HasValue) todo.EnableSmsReminders = enableSms.Value;

            todo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated notification preferences for todo {TodoId} by user {UserId}", todoId, userId);
        }

        private PersonalTodoReadDto MapToReadDto(PersonalTodo todo)
        {
            // Update overdue status before mapping
            if (todo.DueDate.HasValue && DateTime.UtcNow > todo.DueDate.Value && !todo.IsCompleted)
            {
                todo.Status = PersonalTodoStatus.Overdue;
                // Note: We don't save changes here to avoid modifying the entity during read operations
                // The status will be saved when the todo is next updated
            }
            
            TimeSpan? timeUntilDue = todo.DueDate.HasValue ? todo.DueDate.Value - DateTime.UtcNow : (TimeSpan?)null;
            
            return new PersonalTodoReadDto
            {
                TodoId = todo.TodoId,
                Task = todo.Task,
                Description = todo.Description,
                IsCompleted = todo.IsCompleted,
                Progress = todo.Progress,
                CreatedAt = todo.CreatedAt,
                UpdatedAt = todo.UpdatedAt,
                DueDate = todo.DueDate,
                StartDate = todo.StartDate,
                CompletedDate = todo.CompletedDate,
                Priority = todo.Priority,
                Status = todo.Status,
                EnableReminders = todo.EnableReminders,
                ReminderHoursBeforeDue = todo.ReminderHoursBeforeDue,
                LastReminderSent = todo.LastReminderSent,
                EnableEmailReminders = todo.EnableEmailReminders,
                EnablePushNotifications = todo.EnablePushNotifications,
                EnableSmsReminders = todo.EnableSmsReminders,
                Tags = todo.Tags,
                Notes = todo.Notes,
                IsRecurring = todo.IsRecurring,
                RecurrencePattern = todo.RecurrencePattern,
                IsOverdue = todo.IsOverdue,
                TimeUntilDueFormatted = todo.TimeUntilDueFormatted?.ToString(),
                NeedsReminder = todo.NeedsReminder,
                DaysUntilDue = timeUntilDue.HasValue ? (int)timeUntilDue.Value.TotalDays : null,
                HoursUntilDue = timeUntilDue.HasValue ? (int)timeUntilDue.Value.TotalHours : null
            };
        }
    }
}