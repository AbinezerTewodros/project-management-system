namespace ProjectManagementSystem1.Services.EmailService
{
    public interface IEmailService
    {
        // User Management Emails
        Task SendWelcomeEmailAsync(string email, string fullName);
        Task SendPasswordResetEmailAsync(string email, string resetToken);
        Task SendAccountLockedEmailAsync(string email, string fullName);
        Task SendAccountUnlockedEmailAsync(string email, string fullName);
        Task SendRoleChangedEmailAsync(string email, string fullName, string oldRole, string newRole);

        // Project Management Emails
        Task SendProjectAssignmentEmailAsync(string email, string fullName, string projectName);
        Task SendProjectStatusChangedEmailAsync(string email, string fullName, string projectName, string oldStatus, string newStatus);
        Task SendProjectDeadlineEmailAsync(string email, string fullName, string projectName, DateTime deadline);
        Task SendProjectCompletedEmailAsync(string email, string fullName, string projectName);

        // Task Management Emails
        Task SendTaskAssignmentEmailAsync(string email, string fullName, string taskTitle, string projectName);
        Task SendTaskStatusChangedEmailAsync(string email, string fullName, string taskTitle, string oldStatus, string newStatus);
        Task SendTaskDueDateEmailAsync(string email, string fullName, string taskTitle, DateTime dueDate);
        Task SendTaskOverdueEmailAsync(string email, string fullName, string taskTitle);
        Task SendTaskCompletedEmailAsync(string email, string fullName, string taskTitle, string completedBy);

        // Comment Emails
        Task SendCommentNotificationEmailAsync(string email, string fullName, string commenterName, string taskTitle, string comment);
        Task SendCommentReplyEmailAsync(string email, string fullName, string replierName, string taskTitle);

        // File Management Emails
        Task SendFileUploadedEmailAsync(string email, string fullName, string uploaderName, string fileName, string taskTitle);
        Task SendFileSharedEmailAsync(string email, string fullName, string sharerName, string fileName);

        // Personal Todo Emails
        Task SendPersonalTodoDueEmailAsync(string email, string fullName, string todoTitle, DateTime dueDate);
        Task SendPersonalTodoOverdueEmailAsync(string email, string fullName, string todoTitle);

        // System Emails
        Task SendSystemMaintenanceEmailAsync(string email, string fullName, string message, DateTime maintenanceTime);
        Task SendSystemUpdateEmailAsync(string email, string fullName, string version, string changes);
        Task SendSecurityAlertEmailAsync(string email, string fullName, string alertType, string details);

        // General Email Methods
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendEmailInternalAsync(string to, string subject, string body, bool isHtml = true);
        Task<string> SendBulkEmailAsync(List<string> toEmails, string subject, string body, bool isHtml = true);
        Task SendEmailWithAttachmentAsync(string to, string subject, string body, string attachmentPath, bool isHtml = true);

        // Advanced Background Job Email Methods
        Task<string> SendDelayedEmailAsync(string to, string subject, string body, TimeSpan delay, bool isHtml = true);
        Task<string> SendRecurringEmailAsync(string to, string subject, string body, string cronExpression, bool isHtml = true);
        Task<bool> CancelScheduledEmailAsync(string jobId);
        Task<bool> CancelRecurringEmailAsync(string jobId);
    }
}
