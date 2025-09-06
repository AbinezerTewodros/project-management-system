using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ReportDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ReportService;
using System.Text.Json;

namespace ProjectManagementSystem1.Services.ScheduledReportService
{
    public class ScheduledReportService : IScheduledReportService
    {
        private readonly IReportService _reportService;
        private readonly ILogger<ScheduledReportService> _logger;
        private readonly AppDbContext _context;

        public ScheduledReportService(IReportService reportService, ILogger<ScheduledReportService> logger, AppDbContext context)
        {
            _reportService = reportService;
            _logger = logger;
            _context = context;
        }

        public async Task<string> ScheduleReportAsync(ScheduledReportDto scheduledReport, string userId)
        {
            try
            {
                // Validate the scheduled report
                if (string.IsNullOrEmpty(scheduledReport.Name))
                    throw new ArgumentException("Report name is required");

                if (scheduledReport.ScheduleType == ScheduleType.OneTime && !scheduledReport.ScheduledDate.HasValue)
                    throw new ArgumentException("Scheduled date is required for one-time reports");

                if (scheduledReport.ScheduleType == ScheduleType.Recurring && string.IsNullOrEmpty(scheduledReport.CronExpression))
                    throw new ArgumentException("Cron expression is required for recurring reports");

                // Create the job based on schedule type
                string jobId;
                if (scheduledReport.ScheduleType == ScheduleType.OneTime)
                {
                    jobId = BackgroundJob.Schedule(
                        () => ExecuteScheduledReportAsync(scheduledReport, userId),
                        scheduledReport.ScheduledDate ?? DateTime.UtcNow);
                }
                else
                {
                    jobId = $"scheduled-report-{Guid.NewGuid()}";
                    RecurringJob.AddOrUpdate(
                        jobId,
                        () => ExecuteScheduledReportAsync(scheduledReport, userId),
                        scheduledReport.CronExpression);
                }

                // Store the scheduled report metadata
                var scheduledReportEntity = new ScheduledReportEntity
                {
                    JobId = jobId,
                    Name = scheduledReport.Name,
                    Description = scheduledReport.Description,
                    ReportType = scheduledReport.ReportType,
                    ScheduleType = scheduledReport.ScheduleType,
                    CronExpression = scheduledReport.CronExpression,
                    ScheduledDate = scheduledReport.ScheduledDate,
                    ExportFormat = scheduledReport.ExportFormat,
                    Recipients = JsonSerializer.Serialize(scheduledReport.Recipients),
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.ScheduledReports.Add(scheduledReportEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Scheduled report {ReportName} with job ID {JobId}", scheduledReport.Name, jobId);
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling report {ReportName}", scheduledReport.Name);
                throw;
            }
        }

        public async Task<List<ScheduledReportDto>> GetScheduledReportsAsync(string userId)
        {
            try
            {
                var scheduledReports = await _context.ScheduledReports
                    .Where(sr => sr.CreatedByUserId == userId && sr.IsActive)
                    .OrderByDescending(sr => sr.CreatedAt)
                    .ToListAsync();

                return scheduledReports.Select(sr => new ScheduledReportDto
                {
                    JobId = sr.JobId,
                    Name = sr.Name,
                    Description = sr.Description,
                    ReportType = sr.ReportType,
                    ScheduleType = sr.ScheduleType,
                    CronExpression = sr.CronExpression,
                    ScheduledDate = sr.ScheduledDate,
                    ExportFormat = sr.ExportFormat,
                    Recipients = JsonSerializer.Deserialize<List<string>>(sr.Recipients ?? "[]"),
                    CreatedAt = sr.CreatedAt,
                    IsActive = sr.IsActive
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scheduled reports for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> CancelScheduledReportAsync(string jobId, string userId)
        {
            try
            {
                var scheduledReport = await _context.ScheduledReports
                    .FirstOrDefaultAsync(sr => sr.JobId == jobId && sr.CreatedByUserId == userId);

                if (scheduledReport == null)
                    return false;

                // Cancel the Hangfire job
                if (scheduledReport.ScheduleType == ScheduleType.OneTime)
                {
                    BackgroundJob.Delete(jobId);
                }
                else
                {
                    RecurringJob.RemoveIfExists(jobId);
                }

                // Mark as inactive
                scheduledReport.IsActive = false;
                scheduledReport.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Cancelled scheduled report {JobId}", jobId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling scheduled report {JobId}", jobId);
                throw;
            }
        }

        public async Task<bool> UpdateScheduledReportAsync(string jobId, ScheduledReportDto updatedReport, string userId)
        {
            try
            {
                var scheduledReport = await _context.ScheduledReports
                    .FirstOrDefaultAsync(sr => sr.JobId == jobId && sr.CreatedByUserId == userId);

                if (scheduledReport == null)
                    return false;

                // Cancel existing job
                await CancelScheduledReportAsync(jobId, userId);

                // Create new scheduled report
                await ScheduleReportAsync(updatedReport, userId);

                _logger.LogInformation("Updated scheduled report {JobId}", jobId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating scheduled report {JobId}", jobId);
                throw;
            }
        }

        public async Task<List<ScheduledReportExecutionDto>> GetReportExecutionHistoryAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                var query = _context.ScheduledReportExecutions
                    .Where(sre => sre.CreatedByUserId == userId);

                if (fromDate.HasValue)
                    query = query.Where(sre => sre.ExecutedAt >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(sre => sre.ExecutedAt <= toDate.Value);

                var executions = await query
                    .OrderByDescending(sre => sre.ExecutedAt)
                    .Take(100) // Limit to last 100 executions
                    .ToListAsync();

                return executions.Select(e => new ScheduledReportExecutionDto
                {
                    ExecutionId = e.ExecutionId,
                    ReportName = e.ReportName,
                    ReportType = e.ReportType,
                    ExportFormat = e.ExportFormat,
                    ExecutedAt = e.ExecutedAt,
                    Status = e.Status,
                    FileSize = e.FileSize,
                    ErrorMessage = e.ErrorMessage
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving report execution history for user {UserId}", userId);
                throw;
            }
        }

        public async Task<byte[]> GetReportExecutionResultAsync(string executionId, string userId)
        {
            try
            {
                var execution = await _context.ScheduledReportExecutions
                    .FirstOrDefaultAsync(sre => sre.ExecutionId == executionId && sre.CreatedByUserId == userId);

                if (execution == null)
                    throw new ArgumentException("Report execution not found");

                if (execution.Status != "Completed")
                    throw new InvalidOperationException("Report execution is not completed");

                // In a real implementation, you would retrieve the file from storage
                // For now, we'll return a placeholder
                return System.Text.Encoding.UTF8.GetBytes($"Report execution {executionId} completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving report execution result {ExecutionId}", executionId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExecuteScheduledReportAsync(ScheduledReportDto scheduledReport, string userId)
        {
            try
            {
                _logger.LogInformation("Executing scheduled report {ReportName} for user {UserId}", scheduledReport.Name, userId);

                // Generate the report
                var reportRequest = new ReportRequestDto
                {
                    ReportType = scheduledReport.ReportType,
                    StartDate = DateTime.UtcNow.AddDays(-30), // Default to last 30 days
                    EndDate = DateTime.UtcNow,
                    ExportFormat = scheduledReport.ExportFormat
                };

                var reportBytes = await _reportService.ExportReportAsync(reportRequest, userId);

                // Store execution record
                var execution = new ScheduledReportExecutionEntity
                {
                    ExecutionId = Guid.NewGuid().ToString(),
                    JobId = scheduledReport.JobId,
                    ReportName = scheduledReport.Name,
                    ReportType = scheduledReport.ReportType,
                    ExportFormat = scheduledReport.ExportFormat,
                    ExecutedAt = DateTime.UtcNow,
                    Status = "Completed",
                    FileSize = reportBytes.Length,
                    CreatedByUserId = userId
                };

                _context.ScheduledReportExecutions.Add(execution);
                await _context.SaveChangesAsync();

                // In a real implementation, you would:
                // 1. Store the report file in blob storage
                // 2. Send email notifications to recipients
                // 3. Update the execution record with file location

                _logger.LogInformation("Successfully executed scheduled report {ReportName}", scheduledReport.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing scheduled report {ReportName}", scheduledReport.Name);

                // Store failed execution record
                var execution = new ScheduledReportExecutionEntity
                {
                    ExecutionId = Guid.NewGuid().ToString(),
                    JobId = scheduledReport.JobId,
                    ReportName = scheduledReport.Name,
                    ReportType = scheduledReport.ReportType,
                    ExportFormat = scheduledReport.ExportFormat,
                    ExecutedAt = DateTime.UtcNow,
                    Status = "Failed",
                    ErrorMessage = ex.Message,
                    CreatedByUserId = userId
                };

                _context.ScheduledReportExecutions.Add(execution);
                await _context.SaveChangesAsync();

                throw; // Re-throw to trigger Hangfire retry
            }
        }
    }
}
