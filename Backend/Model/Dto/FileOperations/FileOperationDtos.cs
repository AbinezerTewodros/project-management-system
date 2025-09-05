using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.FileOperations
{
    // File Job Status
    public class FileJobStatusDto
    {
        public string JobId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Queued, Processing, Completed, Failed, Cancelled
        public string OperationType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public Guid? AttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public double ProgressPercentage { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ResultUrl { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
    }

    // File Job Result
    public class FileJobResultDto
    {
        public string JobId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string OperationType { get; set; } = string.Empty;
        public Guid? AttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string? ResultData { get; set; }
        public string? ErrorMessage { get; set; }
        public Dictionary<string, object>? OutputMetadata { get; set; }
        public DateTime CompletedAt { get; set; }
        public TimeSpan ProcessingTime { get; set; }
    }

    // File Processing Request
    public class FileProcessingRequestDto
    {
        [Required]
        public Guid AttachmentId { get; set; }
        [Required]
        public string ProcessingType { get; set; } = string.Empty; // "preview", "thumbnail", "metadata", "validation"
        public Dictionary<string, object>? ProcessingOptions { get; set; }
        public int? Priority { get; set; } // 1-10, higher is more important
    }

    // File Conversion Request
    public class FileConversionRequestDto
    {
        [Required]
        public Guid AttachmentId { get; set; }
        [Required]
        public string TargetFormat { get; set; } = string.Empty;
        public Dictionary<string, object>? ConversionOptions { get; set; }
        public bool PreserveOriginal { get; set; } = true;
        public int? Quality { get; set; } // For image/video compression
    }

    // File Analysis Request
    public class FileAnalysisRequestDto
    {
        [Required]
        public Guid AttachmentId { get; set; }
        [Required]
        public string AnalysisType { get; set; } = string.Empty; // "content", "text", "virus", "checksum"
        public Dictionary<string, object>? AnalysisOptions { get; set; }
        public bool DeepAnalysis { get; set; } = false;
    }

    // Bulk File Operation Request
    public class BulkFileOperationRequestDto
    {
        [Required]
        public List<Guid> AttachmentIds { get; set; } = new List<Guid>();
        [Required]
        public string OperationType { get; set; } = string.Empty;
        public Dictionary<string, object>? OperationOptions { get; set; }
        public int? Priority { get; set; }
        public bool ProcessSequentially { get; set; } = false; // If true, process one by one instead of parallel
    }

    // File Transfer Request
    public class FileTransferRequestDto
    {
        [Required]
        public Guid AttachmentId { get; set; }
        [Required]
        public string DestinationPath { get; set; } = string.Empty;
        public string OperationType { get; set; } = "Copy"; // "Copy", "Move"
        public bool OverwriteExisting { get; set; } = false;
        public bool PreservePermissions { get; set; } = true;
    }

    // File Maintenance Request
    public class FileMaintenanceRequestDto
    {
        public string MaintenanceType { get; set; } = string.Empty; // "cleanup", "optimize", "rebuild", "archive"
        public DateTime? CutoffDate { get; set; }
        public bool DryRun { get; set; } = false; // If true, show what would be done without actually doing it
        public Dictionary<string, object>? MaintenanceOptions { get; set; }
    }

    // File Upload Progress
    public class FileUploadProgressDto
    {
        public string JobId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long TotalBytes { get; set; }
        public long UploadedBytes { get; set; }
        public double ProgressPercentage { get; set; }
        public string Status { get; set; } = string.Empty; // "Uploading", "Processing", "Completed", "Failed"
        public DateTime StartedAt { get; set; }
        public TimeSpan EstimatedTimeRemaining { get; set; }
        public string? ErrorMessage { get; set; }
    }

    // File Processing Options
    public class FileProcessingOptionsDto
    {
        public int? MaxFileSize { get; set; } // In bytes
        public List<string>? AllowedFileTypes { get; set; }
        public bool GenerateThumbnail { get; set; } = true;
        public bool ExtractMetadata { get; set; } = true;
        public bool ValidateFile { get; set; } = true;
        public int? ThumbnailWidth { get; set; } = 200;
        public int? ThumbnailHeight { get; set; } = 200;
        public int? CompressionLevel { get; set; } = 6;
        public bool MaintainAspectRatio { get; set; } = true;
    }

    // File Operation Statistics
    public class FileOperationStatisticsDto
    {
        public string UserId { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int TotalJobs { get; set; }
        public int CompletedJobs { get; set; }
        public int FailedJobs { get; set; }
        public int CancelledJobs { get; set; }
        public double AverageProcessingTime { get; set; } // In seconds
        public long TotalProcessedBytes { get; set; }
        public Dictionary<string, int> JobsByOperationType { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> JobsByStatus { get; set; } = new Dictionary<string, int>();
    }
}
