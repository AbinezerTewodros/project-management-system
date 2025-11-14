using ProjectManagementSystem1.Model.Dto.DataProcessing;

namespace ProjectManagementSystem1.Services.DataProcessingService
{
    public interface IDataProcessingService
    {
        // Report Generation Operations
        Task<string> GenerateReportAsync(ReportGenerationRequestDto request, string userId);
        Task<string> GenerateScheduledReportAsync(string reportType, string schedule, string userId);
        Task<string> CancelScheduledReportAsync(string reportId, string userId);

        // Data Export Operations
        Task<string> ExportDataAsync(DataExportRequestDto request, string userId);
        Task<string> ExportDataInBackgroundAsync(DataExportRequestDto request, string userId);
        Task<string> CancelDataExportAsync(string exportId, string userId);

        // Data Import Operations
        Task<string> ImportDataAsync(DataImportRequestDto request, string userId);
        Task<string> ValidateImportDataAsync(DataImportRequestDto request, string userId);
        Task<string> CancelDataImportAsync(string importId, string userId);

        // Data Aggregation Operations
        Task<string> AggregateDataAsync(DataAggregationRequestDto request, string userId);
        Task<string> GenerateTrendAnalysisAsync(DataAggregationRequestDto request, string userId);
        Task<string> GeneratePerformanceMetricsAsync(string entityType, string userId);

        // Data Validation Operations
        Task<string> ValidateDataAsync(DataValidationRequestDto request, string userId);
        Task<string> FixDataIssuesAsync(DataValidationRequestDto request, string userId);
        Task<string> GenerateDataQualityReportAsync(string entityType, string userId);

        // Data Cleanup Operations
        Task<string> CleanupDataAsync(DataCleanupRequestDto request, string userId);
        Task<string> ArchiveOldDataAsync(string entityType, DateTime cutoffDate, string userId);
        Task<string> RemoveDuplicateRecordsAsync(string entityType, string userId);

        // Scheduled Analytics Operations
        Task<string> ScheduleAnalyticsAsync(ScheduledAnalyticsRequestDto request, string userId);
        Task<string> RunAnalyticsNowAsync(ScheduledAnalyticsRequestDto request, string userId);
        Task<string> CancelScheduledAnalyticsAsync(string analyticsId, string userId);

        // Bulk Data Operations
        Task<string> BulkUpdateDataAsync(BulkDataOperationRequestDto request, string userId);
        Task<string> BulkDeleteDataAsync(BulkDataOperationRequestDto request, string userId);
        Task<string> BulkArchiveDataAsync(BulkDataOperationRequestDto request, string userId);

        // Data Sync Operations
        Task<string> SyncDataAsync(DataSyncRequestDto request, string userId);
        Task<string> SyncDataIncrementalAsync(DataSyncRequestDto request, string userId);
        Task<string> CancelDataSyncAsync(string syncId, string userId);

        // Job Status and Results
        Task<DataProcessingJobStatusDto> GetDataProcessingJobStatusAsync(string jobId);
        Task<DataProcessingJobResultDto> GetDataProcessingJobResultAsync(string jobId);
        Task<bool> CancelDataProcessingJobAsync(string jobId);
        Task<List<DataProcessingJobStatusDto>> GetUserDataProcessingJobsAsync(string userId, int pageNumber = 1, int pageSize = 20);
        Task<List<DataProcessingJobStatusDto>> GetJobsByTypeAsync(string operationType, int pageNumber = 1, int pageSize = 20);

        // Utility Operations
        Task<string> GetDataProcessingStatisticsAsync(string userId);
        Task<string> OptimizeDataProcessingAsync(string userId);
        Task<string> BackupDataProcessingConfigurationAsync(string userId);
    }
}
