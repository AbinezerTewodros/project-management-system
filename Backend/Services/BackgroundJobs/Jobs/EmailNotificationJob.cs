using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Services.BackgroundJobs;

namespace ProjectManagementSystem1.Services.BackgroundJobs.Jobs
{
    /// <summary>
    /// Background job for sending email notifications.
    /// </summary>
    public class EmailNotificationJob : IBackgroundJob
    {
        private readonly ILogger<EmailNotificationJob> _logger;

        public EmailNotificationJob(ILogger<EmailNotificationJob> logger)
        {
            _logger = logger;
        }

        public async Task ExecuteAsync(object jobData, CancellationToken cancellationToken = default)
        {
            if (jobData is not EmailNotificationData emailData)
            {
                throw new ArgumentException("Invalid job data type. Expected EmailNotificationData.");
            }

            _logger.LogInformation("Sending email notification to {Recipient} with subject: {Subject}", 
                emailData.RecipientEmail, emailData.Subject);

            // Simulate email sending process
            await Task.Delay(2000, cancellationToken); // Simulate network delay

            _logger.LogInformation("Email notification sent successfully to {Recipient}", emailData.RecipientEmail);
        }

        public string GetJobName() => "Email Notification Job";

        public string GetJobDescription(object jobData)
        {
            if (jobData is EmailNotificationData emailData)
            {
                return $"Send email to {emailData.RecipientEmail} with subject: {emailData.Subject}";
            }
            return "Send email notification";
        }

        public bool ValidateJobData(object jobData)
        {
            return jobData is EmailNotificationData emailData && 
                   !string.IsNullOrEmpty(emailData.RecipientEmail) &&
                   !string.IsNullOrEmpty(emailData.Subject) &&
                   !string.IsNullOrEmpty(emailData.Body);
        }

        public int GetMaxRetryAttempts() => 3;

        public TimeSpan GetRetryDelay() => TimeSpan.FromMinutes(5);

        public TimeSpan GetJobTimeout() => TimeSpan.FromMinutes(10);
    }

    /// <summary>
    /// Data model for email notification job.
    /// </summary>
    public class EmailNotificationData
    {
        /// <summary>
        /// Recipient email address
        /// </summary>
        public string RecipientEmail { get; set; } = string.Empty;

        /// <summary>
        /// Email subject
        /// </summary>
        public string Subject { get; set; } = string.Empty;

        /// <summary>
        /// Email body
        /// </summary>
        public string Body { get; set; } = string.Empty;

        /// <summary>
        /// Sender email address
        /// </summary>
        public string? SenderEmail { get; set; }

        /// <summary>
        /// Whether to send as HTML
        /// </summary>
        public bool IsHtml { get; set; } = false;

        /// <summary>
        /// Priority of the email
        /// </summary>
        public EmailPriority Priority { get; set; } = EmailPriority.Normal;
    }

    /// <summary>
    /// Email priority levels.
    /// </summary>
    public enum EmailPriority
    {
        Low = 0,
        Normal = 1,
        High = 2,
        Urgent = 3
    }
}

