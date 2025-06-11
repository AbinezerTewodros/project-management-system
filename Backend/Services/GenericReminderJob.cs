//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.DependencyInjection;
//using Microsoft.Extensions.Logging;
//using ProjectManagementSystem1.Data;
//using ProjectManagementSystem1.Model.Entities;
//using ProjectManagementSystem1.Model.Interfaces;
//using System;
//using System.Linq;
//using System.Threading.Tasks;

//namespace ProjectManagementSystem1.Services
//{
//    public class GenericReminderJob
//    {
//        private readonly ILogger<GenericReminderJob> _logger;
//        private readonly IServiceScopeFactory _serviceScopeFactory;

//        public GenericReminderJob(ILogger<GenericReminderJob> logger, IServiceScopeFactory serviceScopeFactory)
//        {
//            _logger = logger;
//            _serviceScopeFactory = serviceScopeFactory;
//        }

//        public async Task SendReminders(string entityTypeFullName, int daysBeforeDueDate)
//        {
//            _logger.LogInformation($"Starting to process {entityTypeFullName} reminders for {daysBeforeDueDate} days before due date...");

//            using (var scope = _serviceScopeFactory.CreateScope())
//            {
//                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

//                var reminderDate = DateTime.UtcNow.AddDays(daysBeforeDueDate).Date;
//                var entityType = Type.GetType(entityTypeFullName);

//                if (entityType == null || !typeof(IRemindable).IsAssignableFrom(entityType))
//                {
//                    _logger.LogError($"Could not find or {entityTypeFullName} does not implement IRemindable. Skipping.");
//                    return;
//                }

//                var query = dbContext.Set(entityType).AsQueryable();

//                var remindableEntities = await query
//                    .Where(e => ((IRemindable)e).DueDate.HasValue && ((IRemindable)e).DueDate.Value.Date == reminderDate)
//                    .ToListAsync();

//                foreach (var entity in remindableEntities)
//                {
//                    var remindable = (IRemindable)entity;

//                    if (!string.IsNullOrEmpty(remindable.RecipientUserId))
//                    {
//                        var subject = remindable.ReminderSubjectTemplate.Replace("{Title}", remindable.Title).Replace("{DueDate:yyyy-MM-dd}", remindable.DueDate?.ToString("yyyy-MM-dd"));
//                        var message = remindable.ReminderMessageTemplate.Replace("{Title}", remindable.Title).Replace("{DueDate:yyyy-MM-dd}", remindable.DueDate?.ToString("yyyy-MM-dd"));

//                        await notificationService.CreateNotificationAsync(
//                            recipientUserId: remindable.RecipientUserId,
//                            subject: subject,
//                            message: message,
//                            relatedEntityType: remindable.EntityType,
//                            relatedEntityId: remindable.Id,
//                            deliveryMethod: NotificationDeliveryMethod.Email
//                        );
//                        _logger.LogInformation($"Reminder created for {remindable.EntityType} ID: {remindable.Id}, Due Date: {remindable.DueDate?.ToShortDateString()}, {daysBeforeDueDate} days before.");
//                    }
//                    else
//                    {
//                        _logger.LogWarning($"Could not send reminder for {remindable.EntityType} ID: {remindable.Id} as Recipient User ID is not set.");
//                    }
//                }
//            }

//            _logger.LogInformation($"Finished processing {entityTypeFullName} reminders for {daysBeforeDueDate} days before due date.");
//        }
//    }
//}
