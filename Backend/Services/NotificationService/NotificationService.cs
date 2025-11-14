using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.EmailService;
using Hangfire;

namespace ProjectManagementSystem1.Services.NotificationService
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;


        public NotificationService(AppDbContext context, IEmailService emailService, ILogger<NotificationService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        #region User Management Notifications

        public async Task NotifyUserRegisteredAsync(ApplicationUser user)
        {
            var notification = new Notification
            {
                RecipientUserId = user.Id,
                Subject = "Welcome to Project Management System",
                Message = $"Welcome {user.FullName}! Your account has been successfully created.",
                RelatedEntityType = "User",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            // Send welcome email
            BackgroundJob.Enqueue(() => _emailService.SendWelcomeEmailAsync(user.Email, user.FullName));
        }

        public async Task NotifyUserProfileUpdatedAsync(ApplicationUser user)
        {
            var notification = new Notification
            {
                RecipientUserId = user.Id,
                Subject = "Profile Updated",
                Message = "Your profile has been successfully updated.",
                RelatedEntityType = "User",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyUserAssignedToProjectAsync(string userId, int projectId)
        {
            var notification = new Notification
            {
                RecipientUserId = userId,
                Subject = "Project Assignment",
                Message = $"You have been assigned to a new project.",
                RelatedEntityType = "Project",
                RelatedEntityId = projectId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyUserRoleChangedAsync(ApplicationUser user, string oldRole, string newRole)
        {
            var notification = new Notification
            {
                RecipientUserId = user.Id,
                Subject = "Role Changed",
                Message = $"Your role has been changed from {oldRole} to {newRole}.",
                RelatedEntityType = "User",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyUserAccountLockedAsync(ApplicationUser user)
        {
            var notification = new Notification
            {
                RecipientUserId = user.Id,
                Subject = "Account Locked",
                Message = "Your account has been locked due to multiple failed login attempts.",
                RelatedEntityType = "User",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyUserAccountUnlockedAsync(ApplicationUser user)
        {
            var notification = new Notification
            {
                RecipientUserId = user.Id,
                Subject = "Account Unlocked",
                Message = "Your account has been unlocked. You can now log in.",
                RelatedEntityType = "User",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region Project Management Notifications

        public async Task NotifyProjectCreatedAsync(int projectId, string createdByUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = createdByUserId,
                Subject = "Project Created",
                Message = "A new project has been created successfully.",
                RelatedEntityType = "Project",
                RelatedEntityId = projectId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyProjectStatusChangedAsync(int projectId, string oldStatus, string newStatus, List<string> memberUserIds)
        {
            foreach (var userId in memberUserIds)
            {
                var notification = new Notification
                {
                    RecipientUserId = userId, // Use real userId
                    Subject = "Project Status Changed",
                    Message = $"Project status changed from {oldStatus} to {newStatus}.",
                    RelatedEntityType = "Project",
                    RelatedEntityId = projectId,
                    DeliveryMethod = NotificationDeliveryMethod.InApp,
                    Status = NotificationStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Notifications.AddAsync(notification);
            }
            await _context.SaveChangesAsync();
        }

        public async Task NotifyProjectAssignedAsync(int projectId, string assignedToUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = assignedToUserId,
                Subject = "Project Assigned",
                Message = "You have been assigned to manage a project.",
                RelatedEntityType = "Project",
                RelatedEntityId = projectId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyProjectDeadlineApproachingAsync(int projectId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have project members
                Subject = "Project Deadline Approaching",
                Message = "Project deadline is approaching.",
                RelatedEntityType = "Project",
                RelatedEntityId = projectId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyProjectCompletedAsync(int projectId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have project members
                Subject = "Project Completed",
                Message = "Project has been completed successfully!",
                RelatedEntityType = "Project",
                RelatedEntityId = projectId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region Task Management Notifications

        public async Task NotifyTaskAssignedAsync(int taskId, string assignedToUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = assignedToUserId,
                Subject = "Task Assigned",
                Message = "You have been assigned a new task.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyTaskStatusChangedAsync(int taskId, string oldStatus, string newStatus)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "Task Status Changed",
                Message = $"Task status changed from {oldStatus} to {newStatus}.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyTaskCommentedAsync(int taskId, string commenterUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "New Comment on Task",
                Message = "A new comment has been added to your task.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyTaskDueDateApproachingAsync(int taskId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "Task Due Soon",
                Message = "A task is due soon.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyTaskCompletedAsync(int taskId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have project manager
                Subject = "Task Completed",
                Message = "A task has been completed.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyTaskOverdueAsync(int taskId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "Task Overdue",
                Message = "A task is overdue! Please complete it as soon as possible.",
                RelatedEntityType = "ProjectTask",
                RelatedEntityId = taskId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region File Management Notifications

        public async Task NotifyFileUploadedAsync(int attachmentId, string uploadedByUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "File Uploaded",
                Message = "A new file has been uploaded to a task.",
                RelatedEntityType = "Attachment",
                RelatedEntityId = attachmentId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyFileDownloadedAsync(int attachmentId, string downloadedByUserId)
        {
            // Usually no notification needed for downloads, but could be logged for audit
            _logger.LogInformation($"File {attachmentId} downloaded by user {downloadedByUserId}");
        }

        public async Task NotifyFileDeletedAsync(string fileName, string deletedByUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have admins
                Subject = "File Deleted",
                Message = $"File {fileName} has been deleted.",
                RelatedEntityType = "Attachment",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyFileSharedAsync(int attachmentId, string sharedByUserId, string sharedWithUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = sharedWithUserId,
                Subject = "File Shared",
                Message = "A file has been shared with you.",
                RelatedEntityType = "Attachment",
                RelatedEntityId = attachmentId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region Comment Notifications

        public async Task NotifyCommentAddedAsync(int commentId, string commenterUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have task assignee
                Subject = "New Comment",
                Message = "A new comment has been added to a task.",
                RelatedEntityType = "Comment",
                RelatedEntityId = commentId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyCommentRepliedAsync(int commentId, string replierUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have original commenter
                Subject = "Comment Reply",
                Message = "Someone replied to your comment.",
                RelatedEntityType = "Comment",
                RelatedEntityId = commentId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyUserMentionedAsync(int commentId, string mentionedUserId)
        {
            var notification = new Notification
            {
                RecipientUserId = mentionedUserId,
                Subject = "You Were Mentioned",
                Message = "You were mentioned in a comment.",
                RelatedEntityType = "Comment",
                RelatedEntityId = commentId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region Personal Todo Notifications

        public async Task NotifyPersonalTodoDueAsync(int todoId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have todo owner
                Subject = "Personal Todo Due Soon",
                Message = "Your personal todo is due soon.",
                RelatedEntityType = "PersonalTodo",
                RelatedEntityId = todoId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyPersonalTodoOverdueAsync(int todoId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have todo owner
                Subject = "Personal Todo Overdue",
                Message = "Your personal todo is overdue!",
                RelatedEntityType = "PersonalTodo",
                RelatedEntityId = todoId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyPersonalTodoCompletedAsync(int todoId)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have todo owner
                Subject = "Personal Todo Completed",
                Message = "Congratulations! You completed your personal todo.",
                RelatedEntityType = "PersonalTodo",
                RelatedEntityId = todoId,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region System Notifications

        public async Task NotifySystemMaintenanceAsync(string message, DateTime maintenanceTime)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have all users
                Subject = "System Maintenance",
                Message = $"System maintenance scheduled for {maintenanceTime:MM/dd/yyyy HH:mm}. {message}",
                RelatedEntityType = "System",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifySystemUpdateAsync(string version, string changes)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have all users
                Subject = "System Update",
                Message = $"System updated to version {version}. Changes: {changes}",
                RelatedEntityType = "System",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task NotifySecurityAlertAsync(string alertType, string details)
        {
            var notification = new Notification
            {
                RecipientUserId = "system", // Will be updated when we have admins
                Subject = "Security Alert",
                Message = $"Security alert ({alertType}): {details}",
                RelatedEntityType = "System",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region General Notification Methods

        public async Task SendNotificationAsync(string userId, string title, string message, string type, string entityType = null, int? entityId = null)
        {
            var notification = new Notification
            {
                RecipientUserId = userId,
                Subject = title,
                Message = message,
                RelatedEntityType = entityType ?? "System",
                RelatedEntityId = entityId ?? 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendBulkNotificationAsync(List<string> userIds, string title, string message, string type)
        {
            var notifications = userIds.Select(userId => new Notification
            {
                RecipientUserId = userId,
                Subject = title,
                Message = message,
                RelatedEntityType = "System",
                RelatedEntityId = 0,
                DeliveryMethod = NotificationDeliveryMethod.InApp,
                Status = NotificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();
        }

        public async Task MarkNotificationAsReadAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                notification.Status = NotificationStatus.Sent;
                notification.SentAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllNotificationsAsReadAsync(string userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId && n.Status == NotificationStatus.Pending)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.Status = NotificationStatus.Sent;
                notification.SentAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteNotificationAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int pageNumber = 1, int pageSize = 20)
        {
            var notifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation($"Retrieved {notifications.Count} notifications for user {userId}");
            return notifications;
        }

        public async Task<int> GetUnreadNotificationCountAsync(string userId)
        {
            var count = await _context.Notifications
                .CountAsync(n => n.RecipientUserId == userId && n.Status == NotificationStatus.Pending);

            _logger.LogInformation($"User {userId} has {count} unread notifications");
            return count;
        }

        #endregion
    }
}