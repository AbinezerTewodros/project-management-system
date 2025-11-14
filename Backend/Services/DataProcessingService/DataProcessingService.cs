using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.DataProcessing;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.EmailService;

namespace ProjectManagementSystem1.Services.DataProcessingService
{
    public class DataProcessingService : IDataProcessingService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DataProcessingService> _logger;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;

        public DataProcessingService(
            AppDbContext context,
            ILogger<DataProcessingService> logger,
            IActivityLogService activityLogService,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _activityLogService = activityLogService;
            _emailService = emailService;
        }

        #region Report Generation Operations

        public async Task<string> GenerateReportAsync(ReportGenerationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => GenerateReportInternalAsync(request, userId));
            _logger.LogInformation("Report generation job queued with ID {JobId} for type {ReportType}", jobId, request.ReportType);
            return jobId;
        }

        public async Task<string> GenerateScheduledReportAsync(string reportType, string schedule, string userId)
        {
            RecurringJob.AddOrUpdate($"scheduled_report_{reportType}_{userId}", 
                () => GenerateScheduledReportInternalAsync(reportType, userId), schedule);
            var jobId = $"scheduled_report_{reportType}_{userId}";
            _logger.LogInformation("Scheduled report job created with ID {JobId} for type {ReportType}", jobId, reportType);
            return jobId;
        }

        public async Task<string> CancelScheduledReportAsync(string reportId, string userId)
        {
            RecurringJob.RemoveIfExists(reportId);
            _logger.LogInformation("Scheduled report job {ReportId} cancelled for user {UserId}", reportId, userId);
            return "Scheduled report cancelled successfully";
        }

        #endregion

        #region Data Export Operations

        public async Task<string> ExportDataAsync(DataExportRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ExportDataInternalAsync(request, userId));
            _logger.LogInformation("Data export job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> ExportDataInBackgroundAsync(DataExportRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ExportDataInternalAsync(request, userId));
            _logger.LogInformation("Background data export job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> CancelDataExportAsync(string exportId, string userId)
        {
            BackgroundJob.Delete(exportId);
            _logger.LogInformation("Data export job {ExportId} cancelled for user {UserId}", exportId, userId);
            return "Data export cancelled successfully";
        }

        #endregion

        #region Data Import Operations

        public async Task<string> ImportDataAsync(DataImportRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ImportDataInternalAsync(request, userId));
            _logger.LogInformation("Data import job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> ValidateImportDataAsync(DataImportRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ValidateImportDataInternalAsync(request, userId));
            _logger.LogInformation("Import validation job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> CancelDataImportAsync(string importId, string userId)
        {
            BackgroundJob.Delete(importId);
            _logger.LogInformation("Data import job {ImportId} cancelled for user {UserId}", importId, userId);
            return "Data import cancelled successfully";
        }

        #endregion

        #region Data Aggregation Operations

        public async Task<string> AggregateDataAsync(DataAggregationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => AggregateDataInternalAsync(request, userId));
            _logger.LogInformation("Data aggregation job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> GenerateTrendAnalysisAsync(DataAggregationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => GenerateTrendAnalysisInternalAsync(request, userId));
            _logger.LogInformation("Trend analysis job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> GeneratePerformanceMetricsAsync(string entityType, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => GeneratePerformanceMetricsInternalAsync(entityType, userId));
            _logger.LogInformation("Performance metrics job queued with ID {JobId} for entity {EntityType}", jobId, entityType);
            return jobId;
        }

        #endregion

        #region Data Validation Operations

        public async Task<string> ValidateDataAsync(DataValidationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ValidateDataInternalAsync(request, userId));
            _logger.LogInformation("Data validation job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> FixDataIssuesAsync(DataValidationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => FixDataIssuesInternalAsync(request, userId));
            _logger.LogInformation("Data fix job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> GenerateDataQualityReportAsync(string entityType, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => GenerateDataQualityReportInternalAsync(entityType, userId));
            _logger.LogInformation("Data quality report job queued with ID {JobId} for entity {EntityType}", jobId, entityType);
            return jobId;
        }

        #endregion

        #region Data Cleanup Operations

        public async Task<string> CleanupDataAsync(DataCleanupRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => CleanupDataInternalAsync(request, userId));
            _logger.LogInformation("Data cleanup job queued with ID {JobId} for type {CleanupType}", jobId, request.CleanupType);
            return jobId;
        }

        public async Task<string> ArchiveOldDataAsync(string entityType, DateTime cutoffDate, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => ArchiveOldDataInternalAsync(entityType, cutoffDate, userId));
            _logger.LogInformation("Data archive job queued with ID {JobId} for entity {EntityType}", jobId, entityType);
            return jobId;
        }

        public async Task<string> RemoveDuplicateRecordsAsync(string entityType, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => RemoveDuplicateRecordsInternalAsync(entityType, userId));
            _logger.LogInformation("Duplicate removal job queued with ID {JobId} for entity {EntityType}", jobId, entityType);
            return jobId;
        }

        #endregion

        #region Scheduled Analytics Operations

        public async Task<string> ScheduleAnalyticsAsync(ScheduledAnalyticsRequestDto request, string userId)
        {
            RecurringJob.AddOrUpdate($"analytics_{request.AnalyticsType}_{userId}", 
                () => RunScheduledAnalyticsInternalAsync(request, userId), request.Schedule ?? "0 0 * * *");
            var jobId = $"analytics_{request.AnalyticsType}_{userId}";
            _logger.LogInformation("Scheduled analytics job created with ID {JobId} for type {AnalyticsType}", jobId, request.AnalyticsType);
            return jobId;
        }

        public async Task<string> RunAnalyticsNowAsync(ScheduledAnalyticsRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => RunAnalyticsInternalAsync(request, userId));
            _logger.LogInformation("Analytics job queued with ID {JobId} for type {AnalyticsType}", jobId, request.AnalyticsType);
            return jobId;
        }

        public async Task<string> CancelScheduledAnalyticsAsync(string analyticsId, string userId)
        {
            RecurringJob.RemoveIfExists(analyticsId);
            _logger.LogInformation("Scheduled analytics job {AnalyticsId} cancelled for user {UserId}", analyticsId, userId);
            return "Scheduled analytics cancelled successfully";
        }

        #endregion

        #region Bulk Data Operations

        public async Task<string> BulkUpdateDataAsync(BulkDataOperationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkUpdateDataInternalAsync(request, userId));
            _logger.LogInformation("Bulk update job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> BulkDeleteDataAsync(BulkDataOperationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkDeleteDataInternalAsync(request, userId));
            _logger.LogInformation("Bulk delete job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        public async Task<string> BulkArchiveDataAsync(BulkDataOperationRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkArchiveDataInternalAsync(request, userId));
            _logger.LogInformation("Bulk archive job queued with ID {JobId} for entity {EntityType}", jobId, request.EntityType);
            return jobId;
        }

        #endregion

        #region Data Sync Operations

        public async Task<string> SyncDataAsync(DataSyncRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => SyncDataInternalAsync(request, userId));
            _logger.LogInformation("Data sync job queued with ID {JobId} for source {SourceEntityType}", jobId, request.SourceEntityType);
            return jobId;
        }

        public async Task<string> SyncDataIncrementalAsync(DataSyncRequestDto request, string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => SyncDataIncrementalInternalAsync(request, userId));
            _logger.LogInformation("Incremental sync job queued with ID {JobId} for source {SourceEntityType}", jobId, request.SourceEntityType);
            return jobId;
        }

        public async Task<string> CancelDataSyncAsync(string syncId, string userId)
        {
            BackgroundJob.Delete(syncId);
            _logger.LogInformation("Data sync job {SyncId} cancelled for user {UserId}", syncId, userId);
            return "Data sync cancelled successfully";
        }

        #endregion

        #region Job Status and Results

        public async Task<DataProcessingJobStatusDto> GetDataProcessingJobStatusAsync(string jobId)
        {
            // Implementation will go here
            await Task.Delay(100); // Placeholder
            return new DataProcessingJobStatusDto
            {
                JobId = jobId,
                Status = "Completed",
                OperationType = "Unknown",
                CreatedAt = DateTime.UtcNow,
                UserId = "system"
            };
        }

        public async Task<DataProcessingJobResultDto> GetDataProcessingJobResultAsync(string jobId)
        {
            // Implementation will go here
            await Task.Delay(100); // Placeholder
            return new DataProcessingJobResultDto
            {
                JobId = jobId,
                Success = true,
                OperationType = "Unknown",
                CompletedAt = DateTime.UtcNow,
                ProcessingTime = TimeSpan.FromMinutes(5)
            };
        }

        public async Task<bool> CancelDataProcessingJobAsync(string jobId)
        {
            try
            {
                BackgroundJob.Delete(jobId);
                _logger.LogInformation("Data processing job {JobId} cancelled successfully", jobId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel data processing job {JobId}", jobId);
                return false;
            }
        }

        public async Task<List<DataProcessingJobStatusDto>> GetUserDataProcessingJobsAsync(string userId, int pageNumber = 1, int pageSize = 20)
        {
            // Implementation will go here
            await Task.Delay(100); // Placeholder
            return new List<DataProcessingJobStatusDto>();
        }

        public async Task<List<DataProcessingJobStatusDto>> GetJobsByTypeAsync(string operationType, int pageNumber = 1, int pageSize = 20)
        {
            // Implementation will go here
            await Task.Delay(100); // Placeholder
            return new List<DataProcessingJobStatusDto>();
        }

        #endregion

        #region Utility Operations

        public async Task<string> GetDataProcessingStatisticsAsync(string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => GetDataProcessingStatisticsInternalAsync(userId));
            _logger.LogInformation("Statistics generation job queued with ID {JobId} for user {UserId}", jobId, userId);
            return jobId;
        }

        public async Task<string> OptimizeDataProcessingAsync(string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => OptimizeDataProcessingInternalAsync(userId));
            _logger.LogInformation("Data processing optimization job queued with ID {JobId} for user {UserId}", jobId, userId);
            return jobId;
        }

        public async Task<string> BackupDataProcessingConfigurationAsync(string userId)
        {
            var jobId = BackgroundJob.Enqueue(() => BackupDataProcessingConfigurationInternalAsync(userId));
            _logger.LogInformation("Configuration backup job queued with ID {JobId} for user {UserId}", jobId, userId);
            return jobId;
        }

        #endregion

        #region Internal Implementation Methods

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateReportInternalAsync(ReportGenerationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Report generation completed for type {ReportType}", request.ReportType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate report for type {ReportType}", request.ReportType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateScheduledReportInternalAsync(string reportType, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Scheduled report generated for type {ReportType}", reportType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate scheduled report for type {ReportType}", reportType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExportDataInternalAsync(DataExportRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data export completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ImportDataInternalAsync(DataImportRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data import completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to import data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ValidateImportDataInternalAsync(DataImportRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Import validation completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate import data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task AggregateDataInternalAsync(DataAggregationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data aggregation completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to aggregate data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateTrendAnalysisInternalAsync(DataAggregationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Trend analysis completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate trend analysis for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GeneratePerformanceMetricsInternalAsync(string entityType, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Performance metrics generated for entity {EntityType}", entityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate performance metrics for entity {EntityType}", entityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ValidateDataInternalAsync(DataValidationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data validation completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task FixDataIssuesInternalAsync(DataValidationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data issues fixed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fix data issues for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateDataQualityReportInternalAsync(string entityType, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data quality report generated for entity {EntityType}", entityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate data quality report for entity {EntityType}", entityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task CleanupDataInternalAsync(DataCleanupRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data cleanup completed for type {CleanupType}", request.CleanupType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup data for type {CleanupType}", request.CleanupType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ArchiveOldDataInternalAsync(string entityType, DateTime cutoffDate, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data archive completed for entity {EntityType}", entityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to archive old data for entity {EntityType}", entityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task RemoveDuplicateRecordsInternalAsync(string entityType, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Duplicate records removed for entity {EntityType}", entityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove duplicate records for entity {EntityType}", entityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task RunScheduledAnalyticsInternalAsync(ScheduledAnalyticsRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Scheduled analytics completed for type {AnalyticsType}", request.AnalyticsType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to run scheduled analytics for type {AnalyticsType}", request.AnalyticsType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task RunAnalyticsInternalAsync(ScheduledAnalyticsRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Analytics completed for type {AnalyticsType}", request.AnalyticsType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to run analytics for type {AnalyticsType}", request.AnalyticsType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task BulkUpdateDataInternalAsync(BulkDataOperationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk update completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk update data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task BulkDeleteDataInternalAsync(BulkDataOperationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk delete completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk delete data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task BulkArchiveDataInternalAsync(BulkDataOperationRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk archive completed for entity {EntityType}", request.EntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk archive data for entity {EntityType}", request.EntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task SyncDataInternalAsync(DataSyncRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data sync completed for source {SourceEntityType}", request.SourceEntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync data for source {SourceEntityType}", request.SourceEntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task SyncDataIncrementalInternalAsync(DataSyncRequestDto request, string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Incremental sync completed for source {SourceEntityType}", request.SourceEntityType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync data incrementally for source {SourceEntityType}", request.SourceEntityType);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GetDataProcessingStatisticsInternalAsync(string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data processing statistics generated for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate data processing statistics for user {UserId}", userId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task OptimizeDataProcessingInternalAsync(string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data processing optimization completed for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to optimize data processing for user {UserId}", userId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task BackupDataProcessingConfigurationInternalAsync(string userId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Data processing configuration backup completed for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to backup data processing configuration for user {UserId}", userId);
                throw;
            }
        }

        #endregion
    }
}
