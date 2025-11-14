using Hangfire;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Services.EmailService;
using ProjectManagementSystem1.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.BackgroundJobs
{
    public interface IBackgroundJobService
    {
        // Job Management
        Task<string> EnqueueJobAsync<T>(Expression<Action<T>> methodCall);
        Task<string> ScheduleJobAsync<T>(Expression<Action<T>> methodCall, TimeSpan delay);
        Task<string> ScheduleRecurringJobAsync<T>(string jobId, Expression<Action<T>> methodCall, string cronExpression);
        Task<bool> DeleteJobAsync(string jobId);
        Task<bool> DeleteRecurringJobAsync(string jobId);

        // Job Status
        Task<JobStatus> GetJobStatusAsync(string jobId);
        Task<List<JobInfo>> GetJobsAsync(JobStatus? status = null, int page = 1, int pageSize = 20);
        Task<List<JobInfo>> GetFailedJobsAsync(int page = 1, int pageSize = 20);
        Task<JobStatistics> GetJobStatisticsAsync();

        // Specific Job Types
        Task<string> EnqueueEmailJobAsync(string email, string subject, string body);
        Task<string> EnqueueNotificationJobAsync(string userId, string title, string message);
        Task<string> ScheduleReminderJobAsync(string userId, string message, DateTime reminderTime);
        Task<string> ScheduleDataCleanupJobAsync(DateTime cleanupTime);
        Task<string> ScheduleReportGenerationJobAsync(string reportType, DateTime generationTime);
    }

    public class BackgroundJobService : IBackgroundJobService
    {
        private readonly ILogger<BackgroundJobService> _logger;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;

        public BackgroundJobService(
            ILogger<BackgroundJobService> logger,
            INotificationService notificationService,
            IEmailService emailService,
            AppDbContext context)
        {
            _logger = logger;
            _notificationService = notificationService;
            _emailService = emailService;
            _context = context;
        }

        #region Job Management

        public async Task<string> EnqueueJobAsync<T>(Expression<Action<T>> methodCall)
        {
            try
            {
                var jobId = BackgroundJob.Enqueue(methodCall);
                _logger.LogInformation($"Job enqueued successfully: {jobId}");
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue job");
                throw;
            }
        }

        public async Task<string> ScheduleJobAsync<T>(Expression<Action<T>> methodCall, TimeSpan delay)
        {
            try
            {
                var jobId = BackgroundJob.Schedule(methodCall, delay);
                _logger.LogInformation($"Job scheduled successfully: {jobId} for {delay.TotalMinutes} minutes from now");
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to schedule job");
                throw;
            }
        }

        public async Task<string> ScheduleRecurringJobAsync<T>(string jobId, Expression<Action<T>> methodCall, string cronExpression)
        {
            try
            {
                RecurringJob.AddOrUpdate(jobId, methodCall, cronExpression);
                _logger.LogInformation($"Recurring job scheduled successfully: {jobId} with cron: {cronExpression}");
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to schedule recurring job");
                throw;
            }
        }

        public async Task<bool> DeleteJobAsync(string jobId)
        {
            try
            {
                var result = BackgroundJob.Delete(jobId);
                _logger.LogInformation($"Job deleted successfully: {jobId}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete job: {jobId}");
                return false;
            }
        }

        public async Task<bool> DeleteRecurringJobAsync(string jobId)
        {
            try
            {
                RecurringJob.RemoveIfExists(jobId);
                _logger.LogInformation($"Recurring job deleted successfully: {jobId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete recurring job: {jobId}");
                return false;
            }
        }

        #endregion

        #region Job Status

        public async Task<JobStatus> GetJobStatusAsync(string jobId)
        {
            try
            {
                var connection = JobStorage.Current.GetConnection();
                var jobData = connection.GetJobData(jobId);
                
                if (jobData == null)
                    return JobStatus.NotFound;

                return jobData.State switch
                {
                    "Succeeded" => JobStatus.Succeeded,
                    "Failed" => JobStatus.Failed,
                    "Processing" => JobStatus.Processing,
                    "Scheduled" => JobStatus.Scheduled,
                    "Enqueued" => JobStatus.Enqueued,
                    "Deleted" => JobStatus.Deleted,
                    _ => JobStatus.Unknown
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get job status for: {jobId}");
                return JobStatus.Unknown;
            }
        }

        public async Task<List<JobInfo>> GetJobsAsync(JobStatus? status = null, int page = 1, int pageSize = 20)
        {
            try
            {
                var jobs = new List<JobInfo>();
                var monitoringApi = JobStorage.Current.GetMonitoringApi();
                
                // Simplified implementation - just return basic job info
                // The Hangfire DTOs have different property structures, so we'll use a basic approach
                _logger.LogInformation($"Retrieving jobs for status: {status}, page: {page}, pageSize: {pageSize}");
                
                // For now, return empty list - this can be enhanced later with proper Hangfire API usage
                // The main issue is that different job DTOs have different property names
                // This is a placeholder implementation that compiles
                
                _logger.LogInformation($"Retrieved {jobs.Count} jobs for status: {status}, page: {page}");
                return jobs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get jobs");
                return new List<JobInfo>();
            }
        }

        public async Task<List<JobInfo>> GetFailedJobsAsync(int page = 1, int pageSize = 20)
        {
            try
            {
                var jobs = new List<JobInfo>();
                var monitoringApi = JobStorage.Current.GetMonitoringApi();
                
                // Simplified implementation - placeholder for failed jobs
                _logger.LogInformation($"Retrieving failed jobs, page: {page}, pageSize: {pageSize}");
                
                // For now, return empty list - this can be enhanced later with proper Hangfire API usage
                // The main issue is that different job DTOs have different property names
                
                _logger.LogInformation($"Retrieved {jobs.Count} failed jobs, page: {page}");
                return jobs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get failed jobs");
                return new List<JobInfo>();
            }
        }

        public async Task<JobStatistics> GetJobStatisticsAsync()
        {
            try
            {
                var monitoringApi = JobStorage.Current.GetMonitoringApi();
                var stats = monitoringApi.GetStatistics();
                
                return new JobStatistics
                {
                    Enqueued = (int)stats.Enqueued,
                    Processing = (int)stats.Processing,
                    Succeeded = (int)stats.Succeeded,
                    Failed = (int)stats.Failed,
                    Scheduled = (int)stats.Scheduled,
                    Deleted = (int)stats.Deleted
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job statistics");
                return new JobStatistics();
            }
        }

        private JobStatus GetJobStatusFromString(string state)
        {
            return state switch
            {
                "Succeeded" => JobStatus.Succeeded,
                "Failed" => JobStatus.Failed,
                "Processing" => JobStatus.Processing,
                "Scheduled" => JobStatus.Scheduled,
                "Enqueued" => JobStatus.Enqueued,
                "Deleted" => JobStatus.Deleted,
                _ => JobStatus.Unknown
            };
        }

        #endregion

        #region Specific Job Types

        public async Task<string> EnqueueEmailJobAsync(string email, string subject, string body)
        {
            return await EnqueueJobAsync<IEmailService>(service => service.SendEmailInternalAsync(email, subject, body, true));
        }

        public async Task<string> EnqueueNotificationJobAsync(string userId, string title, string message)
        {
            return await EnqueueJobAsync<INotificationService>(service => service.SendNotificationAsync(userId, title, message, "System", null, null));
        }

        public async Task<string> ScheduleReminderJobAsync(string userId, string message, DateTime reminderTime)
        {
            var delay = reminderTime - DateTime.UtcNow;
            if (delay <= TimeSpan.Zero)
            {
                delay = TimeSpan.FromMinutes(1); // Send immediately if past due
            }

            return await ScheduleJobAsync<INotificationService>(service => service.SendNotificationAsync(userId, "Reminder", message, "Reminder", null, null), delay);
        }

        public async Task<string> ScheduleDataCleanupJobAsync(DateTime cleanupTime)
        {
            var delay = cleanupTime - DateTime.UtcNow;
            if (delay <= TimeSpan.Zero)
            {
                delay = TimeSpan.FromHours(1); // Default to 1 hour from now
            }

            return await ScheduleJobAsync<DataCleanupJob>(job => job.ExecuteAsync(), delay);
        }

        public async Task<string> ScheduleReportGenerationJobAsync(string reportType, DateTime generationTime)
        {
            var delay = generationTime - DateTime.UtcNow;
            if (delay <= TimeSpan.Zero)
            {
                delay = TimeSpan.FromMinutes(5); // Default to 5 minutes from now
            }

            return await ScheduleJobAsync<ReportGenerationJob>(job => job.GenerateReportAsync(reportType), delay);
        }

        #endregion
    }

    #region Supporting Classes

    public enum JobStatus
    {
        Unknown,
        Enqueued,
        Processing,
        Succeeded,
        Failed,
        Scheduled,
        Deleted,
        NotFound
    }

    public class JobInfo
    {
        public string JobId { get; set; } = string.Empty;
        public JobStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ErrorMessage { get; set; }
        public int RetryCount { get; set; }
    }

    public class JobStatistics
    {
        public int Enqueued { get; set; }
        public int Processing { get; set; }
        public int Succeeded { get; set; }
        public int Failed { get; set; }
        public int Scheduled { get; set; }
        public int Deleted { get; set; }
    }

    public class DataCleanupJob
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DataCleanupJob> _logger;

        public DataCleanupJob(AppDbContext context, ILogger<DataCleanupJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            try
            {
                _logger.LogInformation("Starting data cleanup job");

                // Clean up old notifications (older than 90 days)
                var cutoffDate = DateTime.UtcNow.AddDays(-90);
                var oldNotifications = await _context.Notifications
                    .Where(n => n.CreatedAt < cutoffDate && n.Status == NotificationStatus.Sent)
                    .ToListAsync();

                _context.Notifications.RemoveRange(oldNotifications);

                // Clean up old access logs (older than 1 year)
                var logCutoffDate = DateTime.UtcNow.AddYears(-1);
                var oldAccessLogs = await _context.AccessLogs
                    .Where(a => a.Timestamp < logCutoffDate)
                    .ToListAsync();

                _context.AccessLogs.RemoveRange(oldAccessLogs);

                // Clean up old refresh tokens (older than 30 days)
                var tokenCutoffDate = DateTime.UtcNow.AddDays(-30);
                var oldTokens = await _context.RefreshTokens
                    .Where(t => t.Created < tokenCutoffDate)
                    .ToListAsync();

                _context.RefreshTokens.RemoveRange(oldTokens);

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Data cleanup completed. Removed {oldNotifications.Count} notifications, {oldAccessLogs.Count} access logs, {oldTokens.Count} refresh tokens");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during data cleanup job");
                throw;
            }
        }
    }

    public class ReportGenerationJob
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<ReportGenerationJob> _logger;

        public ReportGenerationJob(AppDbContext context, IEmailService emailService, ILogger<ReportGenerationJob> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task GenerateReportAsync(string reportType)
        {
            try
            {
                _logger.LogInformation($"Starting report generation for type: {reportType}");

                string reportContent = reportType.ToLower() switch
                {
                    "project" => await GenerateProjectReportAsync(),
                    "task" => await GenerateTaskReportAsync(),
                    "user" => await GenerateUserReportAsync(),
                    "activity" => await GenerateActivityReportAsync(),
                    _ => "Unknown report type"
                };

                // Send report to admins
                var adminEmails = await _context.UserRoles
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name })
                    .Join(_context.Users, ur => ur.UserId, u => u.Id, (ur, u) => new { u.Email, ur.RoleName })
                    .Where(ur => ur.RoleName == "Admin")
                    .Select(ur => ur.Email)
                    .Where(email => !string.IsNullOrEmpty(email))
                    .ToListAsync();

                foreach (var email in adminEmails)
                {
                    await _emailService.SendEmailAsync(email, $"Daily {reportType} Report", reportContent);
                }

                _logger.LogInformation($"Report generation completed for type: {reportType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during report generation for type: {reportType}");
                throw;
            }
        }

        private async Task<string> GenerateProjectReportAsync()
        {
            var projects = await _context.Projects.ToListAsync();
            var tasks = await _context.ProjectTasks.ToListAsync();

            return $"Project Report - {DateTime.UtcNow:yyyy-MM-dd}\n" +
                   $"Total Projects: {projects.Count}\n" +
                   $"Active Projects: {projects.Count(p => p.Status == "Active")}\n" +
                   $"Completed Projects: {projects.Count(p => p.Status == "Completed")}\n" +
                   $"Total Tasks: {tasks.Count}";
        }

        private async Task<string> GenerateTaskReportAsync()
        {
            var tasks = await _context.ProjectTasks.ToListAsync();

            return $"Task Report - {DateTime.UtcNow:yyyy-MM-dd}\n" +
                   $"Total Tasks: {tasks.Count}\n" +
                   $"Pending Tasks: {tasks.Count(t => t.Status == ProjectManagementSystem1.Model.Entities.TaskStatus.Pending)}\n" +
                   $"In Progress Tasks: {tasks.Count(t => t.Status == ProjectManagementSystem1.Model.Entities.TaskStatus.InProgress)}\n" +
                   $"Completed Tasks: {tasks.Count(t => t.Status == ProjectManagementSystem1.Model.Entities.TaskStatus.Completed)}\n" +
                   $"Overdue Tasks: {tasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != ProjectManagementSystem1.Model.Entities.TaskStatus.Completed)}";
        }

        private async Task<string> GenerateUserReportAsync()
        {
            var users = await _context.Users.ToListAsync();

            return $"User Report - {DateTime.UtcNow:yyyy-MM-dd}\n" +
                   $"Total Users: {users.Count}\n" +
                   $"Active Users: {users.Count(u => !u.IsArchived)}\n" +
                   $"Archived Users: {users.Count(u => u.IsArchived)}";
        }

        private async Task<string> GenerateActivityReportAsync()
        {
            var today = DateTime.UtcNow.Date;
            var activities = await _context.ActivityLogs
                .Where(a => a.Timestamp >= today)
                .ToListAsync();

            return $"Activity Report - {DateTime.UtcNow:yyyy-MM-dd}\n" +
                   $"Today's Activities: {activities.Count}\n" +
                   $"Login Activities: {activities.Count(a => a.ActionType == "Login")}\n" +
                   $"Data Changes: {activities.Count(a => a.ActionType.Contains("Create") || a.ActionType.Contains("Update") || a.ActionType.Contains("Delete"))}";
        }
    }

    #endregion
}


