using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.NotificationService
{
    public interface INotificationService
    {
        // User Management Notifications
        Task NotifyUserRegisteredAsync(ApplicationUser user);
        Task NotifyUserProfileUpdatedAsync(ApplicationUser user);
        Task NotifyUserAssignedToProjectAsync(string userId, int projectId);
        Task NotifyUserRoleChangedAsync(ApplicationUser user, string oldRole, string newRole);
        Task NotifyUserAccountLockedAsync(ApplicationUser user);
        Task NotifyUserAccountUnlockedAsync(ApplicationUser user);

        // Project Management Notifications
        Task NotifyProjectCreatedAsync(int projectId, string createdByUserId);
        Task NotifyProjectStatusChangedAsync(int projectId, string oldStatus, string newStatus, List<string> memberUserIds);
        Task NotifyProjectAssignedAsync(int projectId, string assignedToUserId);
        Task NotifyProjectDeadlineApproachingAsync(int projectId);
        Task NotifyProjectCompletedAsync(int projectId);

        // Task Management Notifications
        Task NotifyTaskAssignedAsync(int taskId, string assignedToUserId);
        Task NotifyTaskStatusChangedAsync(int taskId, string oldStatus, string newStatus);
        Task NotifyTaskCommentedAsync(int taskId, string commenterUserId);
        Task NotifyTaskDueDateApproachingAsync(int taskId);
        Task NotifyTaskCompletedAsync(int taskId);
        Task NotifyTaskOverdueAsync(int taskId);

        // File Management Notifications
        Task NotifyFileUploadedAsync(int attachmentId, string uploadedByUserId);
        Task NotifyFileDownloadedAsync(int attachmentId, string downloadedByUserId);
        Task NotifyFileDeletedAsync(string fileName, string deletedByUserId);
        Task NotifyFileSharedAsync(int attachmentId, string sharedByUserId, string sharedWithUserId);

        // Comment Notifications
        Task NotifyCommentAddedAsync(int commentId, string commenterUserId);
        Task NotifyCommentRepliedAsync(int commentId, string replierUserId);
        Task NotifyUserMentionedAsync(int commentId, string mentionedUserId);

        // Personal Todo Notifications
        Task NotifyPersonalTodoDueAsync(int todoId);
        Task NotifyPersonalTodoOverdueAsync(int todoId);
        Task NotifyPersonalTodoCompletedAsync(int todoId);

        // System Notifications
        Task NotifySystemMaintenanceAsync(string message, DateTime maintenanceTime);
        Task NotifySystemUpdateAsync(string version, string changes);
        Task NotifySecurityAlertAsync(string alertType, string details);

        // General Notification Methods
        Task SendNotificationAsync(string userId, string title, string message, string type, string entityType = null, int? entityId = null);
        Task SendBulkNotificationAsync(List<string> userIds, string title, string message, string type);
        Task MarkNotificationAsReadAsync(int notificationId);
        Task MarkAllNotificationsAsReadAsync(string userId);
        Task DeleteNotificationAsync(int notificationId);
        Task<List<Notification>> GetUserNotificationsAsync(string userId, int pageNumber = 1, int pageSize = 20);
        Task<int> GetUnreadNotificationCountAsync(string userId);
    }
}