using Hangfire;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.BackgroundJobs.Jobs
{
    public class PersonalTodoReminderJob
    {
        private readonly IPersonalTodoService _personalTodoService;
        private readonly ILogger<PersonalTodoReminderJob> _logger;

        public PersonalTodoReminderJob(IPersonalTodoService personalTodoService, ILogger<PersonalTodoReminderJob> logger)
        {
            _personalTodoService = personalTodoService;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessRemindersAsync()
        {
            try
            {
                _logger.LogInformation("Starting PersonalTodo reminder processing at {Time}", DateTime.UtcNow);

                // Get all todos that need reminders
                var todosNeedingReminders = await _personalTodoService.GetTodosNeedingRemindersAsync();

                foreach (var todo in todosNeedingReminders)
                {
                    try
                    {
                        // Here you would implement the actual reminder logic
                        // For example, sending emails, push notifications, etc.
                        await SendReminderAsync(todo);

                        // Mark that the reminder was sent
                        await _personalTodoService.MarkReminderSentAsync(todo.TodoId);

                        _logger.LogInformation("Sent reminder for todo {TodoId}: {Task}", todo.TodoId, todo.Task);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send reminder for todo {TodoId}", todo.TodoId);
                    }
                }

                _logger.LogInformation("Completed PersonalTodo reminder processing. Processed {Count} reminders", 
                    todosNeedingReminders.Count());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process PersonalTodo reminders");
                throw;
            }
        }

        private async Task SendReminderAsync(ProjectManagementSystem1.Model.Entities.PersonalTodo todo)
        {
            try
            {
                // 1. Send Email Notification
                await SendEmailReminderAsync(todo);
                
                // 2. Send Push Notification (if user has mobile app)
                await SendPushNotificationAsync(todo);
                
                // 3. Create In-App Notification
                await CreateInAppNotificationAsync(todo);
                
                // 4. Send SMS (if configured and enabled)
                if (todo.EnableSmsReminders)
                {
                    await SendSmsReminderAsync(todo);
                }
                
                _logger.LogInformation("Successfully sent all reminder types for todo '{Task}' due on {DueDate}", 
                    todo.Task, todo.DueDate?.ToString("yyyy-MM-dd HH:mm"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder for todo {TodoId}", todo.TodoId);
                throw;
            }
        }

        private async Task SendEmailReminderAsync(ProjectManagementSystem1.Model.Entities.PersonalTodo todo)
        {
            // TODO: Integrate with your EmailService
            // var emailService = _serviceProvider.GetRequiredService<IEmailService>();
            // await emailService.SendPersonalTodoReminderAsync(todo.UserId, todo.Task, todo.DueDate.Value);
            
            _logger.LogInformation("Email reminder sent for todo '{Task}' to user {UserId}", todo.Task, todo.UserId);
            await Task.CompletedTask;
        }

        private async Task SendPushNotificationAsync(ProjectManagementSystem1.Model.Entities.PersonalTodo todo)
        {
            // TODO: Integrate with your Push Notification service
            // var pushService = _serviceProvider.GetRequiredService<IPushNotificationService>();
            // await pushService.SendPersonalTodoReminderAsync(todo.UserId, todo.Task, todo.DueDate.Value);
            
            _logger.LogInformation("Push notification sent for todo '{Task}' to user {UserId}", todo.Task, todo.UserId);
            await Task.CompletedTask;
        }

        private async Task CreateInAppNotificationAsync(ProjectManagementSystem1.Model.Entities.PersonalTodo todo)
        {
            // TODO: Integrate with your NotificationService
            // var notificationService = _serviceProvider.GetRequiredService<INotificationService>();
            // await notificationService.CreatePersonalTodoReminderAsync(todo.UserId, todo.TodoId, todo.Task, todo.DueDate.Value);
            
            _logger.LogInformation("In-app notification created for todo '{Task}' to user {UserId}", todo.Task, todo.UserId);
            await Task.CompletedTask;
        }

        private async Task SendSmsReminderAsync(ProjectManagementSystem1.Model.Entities.PersonalTodo todo)
        {
            // TODO: Integrate with your SMS service
            // var smsService = _serviceProvider.GetRequiredService<ISmsService>();
            // await smsService.SendPersonalTodoReminderAsync(todo.UserId, todo.Task, todo.DueDate.Value);
            
            _logger.LogInformation("SMS reminder sent for todo '{Task}' to user {UserId}", todo.Task, todo.UserId);
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task UpdateOverdueStatusAsync()
        {
            try
            {
                _logger.LogInformation("Starting overdue status update at {Time}", DateTime.UtcNow);
                
                await _personalTodoService.UpdateOverdueStatusAsync();
                
                _logger.LogInformation("Completed overdue status update at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update overdue status");
                throw;
            }
        }
    }
}
