using System.Net.Mail;
using System.Net;
using Microsoft.Extensions.Options;
using ProjectManagementSystem1.Model.Entities;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace ProjectManagementSystem1.Services.EmailService
{
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<SmtpSettings> smtpSettings, ILogger<EmailService> logger)
        {
            _smtpSettings = smtpSettings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            // Use background job for immediate email sending (0 delay) with retry policy
            var jobId = BackgroundJob.Schedule(() => SendEmailInternalAsync(to, subject, body, isHtml), TimeSpan.Zero);
            _logger.LogInformation("Email job queued with ID {JobId} for {To} with subject: {Subject}", jobId, to, subject);
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task SendEmailInternalAsync(string to, string subject, string body, bool isHtml = true)
        {
            try
            {
                using var client = CreateSmtpClient();
                using var message = CreateMailMessage(to, subject, body, isHtml);
                
                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent successfully to {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", to);
                throw;
            }
        }

        // Retry delay function for Hangfire
        public static int GetDelayInSeconds(int attemptNumber)
        {
            return attemptNumber switch
            {
                1 => 30,   // 30 seconds after first failure
                2 => 300,  // 5 minutes after second failure
                3 => 1800, // 30 minutes after third failure
                _ => 3600  // 1 hour for any additional attempts
            };
        }

        public async Task SendEmailWithAttachmentAsync(string to, string subject, string body, string attachmentPath, bool isHtml = true)
        {
            // Use background job for email with attachment
            BackgroundJob.Schedule(() => SendEmailWithAttachmentInternalAsync(to, subject, body, attachmentPath, isHtml), TimeSpan.Zero);
            _logger.LogInformation("Email with attachment job queued for {To} with subject: {Subject}", to, subject);
        }

        [AutomaticRetry(Attempts = 3)]
        private async Task SendEmailWithAttachmentInternalAsync(string to, string subject, string body, string attachmentPath, bool isHtml = true)
        {
            try
            {
                using var client = CreateSmtpClient();
                using var message = CreateMailMessage(to, subject, body, isHtml);
                
                if (File.Exists(attachmentPath))
                {
                    var attachment = new System.Net.Mail.Attachment(attachmentPath);
                    message.Attachments.Add(attachment);
                }
                
                await client.SendMailAsync(message);
                _logger.LogInformation("Email with attachment sent successfully to {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email with attachment to {To}", to);
                throw;
            }
        }

        public async Task<string> SendBulkEmailAsync(List<string> toEmails, string subject, string body, bool isHtml = true)
        {
            // Use background job for bulk email processing
            var jobId = BackgroundJob.Enqueue(() => SendBulkEmailInternalAsync(toEmails, subject, body, isHtml));
            _logger.LogInformation("Bulk email job queued with ID {JobId} for {Count} recipients", jobId, toEmails.Count);
            return jobId;
        }

        [AutomaticRetry(Attempts = 2)]
        private async Task SendBulkEmailInternalAsync(List<string> toEmails, string subject, string body, bool isHtml = true)
        {
            try
            {
                using var client = CreateSmtpClient();
                foreach (var email in toEmails)
                {
                    using var message = CreateMailMessage(email, subject, body, isHtml);
                    await client.SendMailAsync(message);
                    
                    // Small delay to prevent overwhelming SMTP server
                    await Task.Delay(100);
                }
                _logger.LogInformation("Bulk email sent successfully to {Count} recipients", toEmails.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send bulk email to {Count} recipients", toEmails.Count);
                throw;
            }
        }

        // Retry delay function for bulk emails (shorter delays)
        public static int GetBulkEmailDelayInSeconds(int attemptNumber)
        {
            return attemptNumber switch
            {
                1 => 60,   // 1 minute after first failure
                2 => 600,  // 10 minutes after second failure
                _ => 1800  // 30 minutes for any additional attempts
            };
        }

        // Additional background job methods for better email management
        public async Task<string> SendDelayedEmailAsync(string to, string subject, string body, TimeSpan delay, bool isHtml = true)
        {
            var jobId = BackgroundJob.Schedule(() => SendEmailInternalAsync(to, subject, body, isHtml), delay);
            _logger.LogInformation("Delayed email job queued with ID {JobId} for {To}, scheduled in {Delay}", jobId, to, delay);
            return jobId;
        }

        public async Task<string> SendRecurringEmailAsync(string to, string subject, string body, string cronExpression, bool isHtml = true)
        {
            var jobId = $"recurring-email-{Guid.NewGuid()}";
            RecurringJob.AddOrUpdate(jobId, () => SendEmailInternalAsync(to, subject, body, isHtml), cronExpression);
            _logger.LogInformation("Recurring email job created with ID {JobId} for {To} using cron: {Cron}", jobId, to, cronExpression);
            return jobId;
        }

        public async Task<bool> CancelScheduledEmailAsync(string jobId)
        {
            try
            {
                BackgroundJob.Delete(jobId);
                _logger.LogInformation("Scheduled email job {JobId} cancelled successfully", jobId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel scheduled email job {JobId}", jobId);
                return false;
            }
        }

        public async Task<bool> CancelRecurringEmailAsync(string jobId)
        {
            try
            {
                RecurringJob.RemoveIfExists(jobId);
                _logger.LogInformation("Recurring email job {JobId} cancelled successfully", jobId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel recurring email job {JobId}", jobId);
                return false;
            }
        }

        // User Management Emails
        public async Task SendWelcomeEmailAsync(string email, string fullName)
        {
            var subject = "Welcome to Project Management System";
            var body = $@"
                <h2>Welcome {fullName}!</h2>
                <p>Your account has been successfully created.</p>
                <p>We're excited to have you on board!</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            var subject = "Password Reset Request";
            var body = $@"
                <h2>Password Reset</h2>
                <p>You requested a password reset. Use this token: <strong>{resetToken}</strong></p>
                <p>If you didn't request this, please ignore this email.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendAccountLockedEmailAsync(string email, string fullName)
        {
            var subject = "Account Locked";
            var body = $@"
                <h2>Account Security Alert</h2>
                <p>Dear {fullName},</p>
                <p>Your account has been locked due to multiple failed login attempts.</p>
                <p>Please contact support to unlock your account.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendAccountUnlockedEmailAsync(string email, string fullName)
        {
            var subject = "Account Unlocked";
            var body = $@"
                <h2>Account Access Restored</h2>
                <p>Dear {fullName},</p>
                <p>Your account has been unlocked. You can now log in normally.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendRoleChangedEmailAsync(string email, string fullName, string oldRole, string newRole)
        {
            var subject = "Role Change Notification";
            var body = $@"
                <h2>Role Update</h2>
                <p>Dear {fullName},</p>
                <p>Your role has been changed from <strong>{oldRole}</strong> to <strong>{newRole}</strong>.</p>";
            await SendEmailAsync(email, subject, body);
        }

        // Project Management Emails
        public async Task SendProjectAssignmentEmailAsync(string email, string fullName, string projectName)
        {
            var subject = "Project Assignment";
            var body = $@"
                <h2>New Project Assignment</h2>
                <p>Dear {fullName},</p>
                <p>You have been assigned to project: <strong>{projectName}</strong></p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendProjectStatusChangedEmailAsync(string email, string fullName, string projectName, string oldStatus, string newStatus)
        {
            var subject = "Project Status Update";
            var body = $@"
                <h2>Project Status Change</h2>
                <p>Dear {fullName},</p>
                <p>Project <strong>{projectName}</strong> status changed from {oldStatus} to {newStatus}.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendProjectDeadlineEmailAsync(string email, string fullName, string projectName, DateTime deadline)
        {
            var subject = "Project Deadline Reminder";
            var body = $@"
                <h2>Deadline Approaching</h2>
                <p>Dear {fullName},</p>
                <p>Project <strong>{projectName}</strong> deadline is: {deadline:MM/dd/yyyy}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendProjectCompletedEmailAsync(string email, string fullName, string projectName)
        {
            var subject = "Project Completed";
            var body = $@"
                <h2>Congratulations!</h2>
                <p>Dear {fullName},</p>
                <p>Project <strong>{projectName}</strong> has been completed successfully!</p>";
            await SendEmailAsync(email, subject, body);
        }

        // Task Management Emails
        public async Task SendTaskAssignmentEmailAsync(string email, string fullName, string taskTitle, string projectName)
        {
            var subject = "Task Assignment";
            var body = $@"
                <h2>New Task Assignment</h2>
                <p>Dear {fullName},</p>
                <p>You have been assigned task: <strong>{taskTitle}</strong> in project: {projectName}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendTaskStatusChangedEmailAsync(string email, string fullName, string taskTitle, string oldStatus, string newStatus)
        {
            var subject = "Task Status Update";
            var body = $@"
                <h2>Task Status Change</h2>
                <p>Dear {fullName},</p>
                <p>Task <strong>{taskTitle}</strong> status changed from {oldStatus} to {newStatus}.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendTaskDueDateEmailAsync(string email, string fullName, string taskTitle, DateTime dueDate)
        {
            var subject = "Task Due Date Reminder";
            var body = $@"
                <h2>Due Date Approaching</h2>
                <p>Dear {fullName},</p>
                <p>Task <strong>{taskTitle}</strong> is due on: {dueDate:MM/dd/yyyy}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendTaskOverdueEmailAsync(string email, string fullName, string taskTitle)
        {
            var subject = "Task Overdue";
            var body = $@"
                <h2>Task Overdue Alert</h2>
                <p>Dear {fullName},</p>
                <p>Task <strong>{taskTitle}</strong> is overdue. Please update the status.</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendTaskCompletedEmailAsync(string email, string fullName, string taskTitle, string completedBy)
        {
            var subject = "Task Completed";
            var body = $@"
                <h2>Task Completion</h2>
                <p>Dear {fullName},</p>
                <p>Task <strong>{taskTitle}</strong> has been completed by {completedBy}.</p>";
            await SendEmailAsync(email, subject, body);
        }

        // Comment Emails
        public async Task SendCommentNotificationEmailAsync(string email, string fullName, string commenterName, string taskTitle, string comment)
        {
            var subject = "New Comment on Task";
            var body = $@"
                <h2>New Comment</h2>
                <p>Dear {fullName},</p>
                <p>{commenterName} commented on task <strong>{taskTitle}</strong>:</p>
                <p><em>{comment}</em></p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendCommentReplyEmailAsync(string email, string fullName, string replierName, string taskTitle)
        {
            var subject = "Reply to Your Comment";
            var body = $@"
                <h2>Comment Reply</h2>
                <p>Dear {fullName},</p>
                <p>{replierName} replied to your comment on task <strong>{taskTitle}</strong>.</p>";
            await SendEmailAsync(email, subject, body);
        }

        // File Management Emails
        public async Task SendFileUploadedEmailAsync(string email, string fullName, string uploaderName, string fileName, string taskTitle)
        {
            var subject = "File Uploaded";
            var body = $@"
                <h2>New File Upload</h2>
                <p>Dear {fullName},</p>
                <p>{uploaderName} uploaded file <strong>{fileName}</strong> to task: {taskTitle}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendFileSharedEmailAsync(string email, string fullName, string sharerName, string fileName)
        {
            var subject = "File Shared";
            var body = $@"
                <h2>File Shared</h2>
                <p>Dear {fullName},</p>
                <p>{sharerName} shared file <strong>{fileName}</strong> with you.</p>";
            await SendEmailAsync(email, subject, body);
        }

        // Personal Todo Emails
        public async Task SendPersonalTodoDueEmailAsync(string email, string fullName, string todoTitle, DateTime dueDate)
        {
            var subject = "Personal Todo Due Soon";
            var body = $@"
                <h2>Todo Reminder</h2>
                <p>Dear {fullName},</p>
                <p>Your todo <strong>{todoTitle}</strong> is due on: {dueDate:MM/dd/yyyy}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPersonalTodoOverdueEmailAsync(string email, string fullName, string todoTitle)
        {
            var subject = "Personal Todo Overdue";
            var body = $@"
                <h2>Todo Overdue</h2>
                <p>Dear {fullName},</p>
                <p>Your todo <strong>{todoTitle}</strong> is overdue. Please update the status.</p>";
            await SendEmailAsync(email, subject, body);
        }

        // System Emails
        public async Task SendSystemMaintenanceEmailAsync(string email, string fullName, string message, DateTime maintenanceTime)
        {
            var subject = "System Maintenance Scheduled";
            var body = $@"
                <h2>Maintenance Notice</h2>
                <p>Dear {fullName},</p>
                <p>System maintenance is scheduled for: {maintenanceTime:MM/dd/yyyy HH:mm}</p>
                <p>Message: {message}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendSystemUpdateEmailAsync(string email, string fullName, string version, string changes)
        {
            var subject = "System Update Available";
            var body = $@"
                <h2>System Update</h2>
                <p>Dear {fullName},</p>
                <p>Version {version} is now available with the following changes:</p>
                <p>{changes}</p>";
            await SendEmailAsync(email, subject, body);
        }

        public async Task SendSecurityAlertEmailAsync(string email, string fullName, string alertType, string details)
        {
            var subject = "Security Alert";
            var body = $@"
                <h2>Security Alert</h2>
                <p>Dear {fullName},</p>
                <p>Security alert: {alertType}</p>
                <p>Details: {details}</p>";
            await SendEmailAsync(email, subject, body);
        }

        private SmtpClient CreateSmtpClient()
        {
            return new SmtpClient
            {
                Host = _smtpSettings.Host,
                Port = int.Parse(_smtpSettings.Port),
                EnableSsl = _smtpSettings.UseSsl,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };
        }

        private MailMessage CreateMailMessage(string to, string subject, string body, bool isHtml)
        {
            var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.SenderEmail),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            
            message.To.Add(to);
            return message;
        }
    }
}
