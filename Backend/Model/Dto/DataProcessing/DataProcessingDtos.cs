using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.DataProcessing
{
    // Data Processing Job Status
    public class DataProcessingJobStatusDto
    {
        public string JobId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Queued, Processing, Completed, Failed, Cancelled
        public string OperationType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public double ProgressPercentage { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ResultUrl { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
        public int TotalRecords { get; set; }
        public int ProcessedRecords { get; set; }
    }

    // Data Processing Job Result
    public class DataProcessingJobResultDto
    {
        public string JobId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string OperationType { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public string? ResultData { get; set; }
        public string? ErrorMessage { get; set; }
        public Dictionary<string, object>? OutputMetadata { get; set; }
        public DateTime CompletedAt { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public int TotalRecordsProcessed { get; set; }
        public int SuccessfulRecords { get; set; }
        public int FailedRecords { get; set; }
        public string? DownloadUrl { get; set; }
        public long? FileSizeBytes { get; set; }
    }

    // Report Generation Request
    public class ReportGenerationRequestDto
    {
        [Required]
        public string ReportType { get; set; } = string.Empty; // "project_summary", "user_activity", "task_analytics", "financial_summary"
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Dictionary<string, object>? ReportParameters { get; set; }
        public string? OutputFormat { get; set; } = "PDF"; // PDF, Excel, CSV, JSON
        public bool IncludeCharts { get; set; } = true;
        public bool IncludeRawData { get; set; } = false;
        public int? Priority { get; set; } // 1-10, higher is more important
    }

    // Data Export Request
    public class DataExportRequestDto
    {
        [Required]
        public string EntityType { get; set; } = string.Empty; // "projects", "tasks", "users", "issues", "personal_todos"
        public string? OutputFormat { get; set; } = "Excel"; // Excel, CSV, JSON, XML
        public List<string>? FieldsToInclude { get; set; }
        public Dictionary<string, object>? FilterCriteria { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = false;
        public int? MaxRecords { get; set; }
        public bool IncludeRelatedData { get; set; } = false;
        public string? CustomFileName { get; set; }
        public int? Priority { get; set; }
    }

    // Data Import Request
    public class DataImportRequestDto
    {
        [Required]
        public string EntityType { get; set; } = string.Empty; // "projects", "tasks", "users", "issues"
        [Required]
        public string FileUrl { get; set; } = string.Empty;
        public string? FileFormat { get; set; } // Auto-detected if not specified
        public bool ValidateOnly { get; set; } = false; // If true, only validate without importing
        public bool SkipDuplicates { get; set; } = true;
        public bool UpdateExisting { get; set; } = false;
        public Dictionary<string, string>? FieldMappings { get; set; } // Source field -> Target field
        public List<string>? RequiredFields { get; set; }
        public Dictionary<string, object>? ImportOptions { get; set; }
        public int? Priority { get; set; }
    }

    // Data Aggregation Request
    public class DataAggregationRequestDto
    {
        [Required]
        public string EntityType { get; set; } = string.Empty; // "projects", "tasks", "users", "issues"
        [Required]
        public string AggregationType { get; set; } = string.Empty; // "count", "sum", "average", "min", "max", "group_by"
        public string? FieldToAggregate { get; set; }
        public List<string>? GroupByFields { get; set; }
        public Dictionary<string, object>? FilterCriteria { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? TimeInterval { get; set; } // "hourly", "daily", "weekly", "monthly", "quarterly", "yearly"
        public bool IncludeTrends { get; set; } = false;
        public int? TrendPeriods { get; set; } = 12;
        public Dictionary<string, object>? AggregationOptions { get; set; }
        public int? Priority { get; set; }
    }

    // Data Validation Request
    public class DataValidationRequestDto
    {
        [Required]
        public string EntityType { get; set; } = string.Empty; // "projects", "tasks", "users", "issues", "personal_todos"
        public List<string>? ValidationRules { get; set; } // "required_fields", "data_types", "business_rules", "referential_integrity"
        public Dictionary<string, object>? FilterCriteria { get; set; }
        public bool FixIssues { get; set; } = false; // If true, attempt to fix validation issues
        public bool GenerateReport { get; set; } = true;
        public string? ReportFormat { get; set; } = "PDF";
        public List<string>? SpecificFields { get; set; } // If null, validate all fields
        public Dictionary<string, object>? ValidationOptions { get; set; }
        public int? Priority { get; set; }
    }

    // Data Cleanup Request
    public class DataCleanupRequestDto
    {
        [Required]
        public string CleanupType { get; set; } = string.Empty; // "orphaned_records", "duplicate_records", "old_records", "incomplete_records"
        public string? EntityType { get; set; }
        public DateTime? CutoffDate { get; set; }
        public bool DryRun { get; set; } = true; // If true, only show what would be cleaned up
        public bool BackupBeforeCleanup { get; set; } = true;
        public Dictionary<string, object>? CleanupRules { get; set; }
        public int? MaxRecordsToProcess { get; set; }
        public bool GenerateReport { get; set; } = true;
        public string? ReportFormat { get; set; } = "PDF";
        public int? Priority { get; set; }
    }

    // Scheduled Analytics Request
    public class ScheduledAnalyticsRequestDto
    {
        [Required]
        public string AnalyticsType { get; set; } = string.Empty; // "performance_metrics", "trend_analysis", "predictive_insights", "anomaly_detection"
        public string? EntityType { get; set; }
        public string? Schedule { get; set; } // Cron expression or "daily", "weekly", "monthly"
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Dictionary<string, object>? AnalyticsParameters { get; set; }
        public bool SendNotifications { get; set; } = true;
        public List<string>? NotificationEmails { get; set; }
        public string? OutputFormat { get; set; } = "PDF";
        public bool IncludeVisualizations { get; set; } = true;
        public Dictionary<string, object>? AnalyticsOptions { get; set; }
        public int? Priority { get; set; }
    }

    // Bulk Data Operation Request
    public class BulkDataOperationRequestDto
    {
        [Required]
        public string OperationType { get; set; } = string.Empty; // "update", "delete", "archive", "restore", "validate"
        [Required]
        public string EntityType { get; set; } = string.Empty;
        public List<string>? EntityIds { get; set; }
        public Dictionary<string, object>? FilterCriteria { get; set; }
        public Dictionary<string, object>? UpdateData { get; set; } // For update operations
        public bool ProcessSequentially { get; set; } = false; // If true, process one by one instead of parallel
        public int? BatchSize { get; set; } = 1000;
        public bool RollbackOnError { get; set; } = true;
        public int? MaxRetries { get; set; } = 3;
        public Dictionary<string, object>? OperationOptions { get; set; }
        public int? Priority { get; set; }
    }

    // Data Sync Request
    public class DataSyncRequestDto
    {
        [Required]
        public string SyncType { get; set; } = string.Empty; // "full_sync", "incremental_sync", "selective_sync"
        [Required]
        public string SourceEntityType { get; set; } = string.Empty;
        public string? TargetEntityType { get; set; } // If null, same as source
        public DateTime? LastSyncDate { get; set; }
        public List<string>? FieldsToSync { get; set; }
        public Dictionary<string, object>? SyncRules { get; set; }
        public bool ValidateAfterSync { get; set; } = true;
        public bool GenerateSyncReport { get; set; } = true;
        public string? ReportFormat { get; set; } = "PDF";
        public Dictionary<string, object>? SyncOptions { get; set; }
        public int? Priority { get; set; }
    }
}
