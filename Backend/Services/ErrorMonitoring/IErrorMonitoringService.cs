using ProjectManagementSystem1.Model.Dto.Common;

namespace ProjectManagementSystem1.Services.ErrorMonitoring
{
    /// <summary>
    /// Service for monitoring and tracking errors across the application.
    /// </summary>
    public interface IErrorMonitoringService
    {
        /// <summary>
        /// Records an error for monitoring and analytics.
        /// </summary>
        /// <param name="errorResponse">The error response to record</param>
        /// <param name="context">Additional context information</param>
        Task RecordErrorAsync(ErrorResponse errorResponse, ErrorContext context);

        /// <summary>
        /// Gets error statistics for the specified time period.
        /// </summary>
        /// <param name="startDate">Start date for the period</param>
        /// <param name="endDate">End date for the period</param>
        /// <returns>Error statistics</returns>
        Task<ErrorStatistics> GetErrorStatisticsAsync(DateTime startDate, DateTime endDate);

        /// <summary>
        /// Gets the most frequent errors in the specified time period.
        /// </summary>
        /// <param name="startDate">Start date for the period</param>
        /// <param name="endDate">End date for the period</param>
        /// <param name="limit">Maximum number of errors to return</param>
        /// <returns>List of frequent errors</returns>
        Task<List<FrequentError>> GetFrequentErrorsAsync(DateTime startDate, DateTime endDate, int limit = 10);

        /// <summary>
        /// Gets errors by severity level in the specified time period.
        /// </summary>
        /// <param name="severity">Error severity level</param>
        /// <param name="startDate">Start date for the period</param>
        /// <param name="endDate">End date for the period</param>
        /// <param name="pageNumber">Page number for pagination</param>
        /// <param name="pageSize">Page size for pagination</param>
        /// <returns>Paginated list of errors</returns>
        Task<PaginatedResponse<ErrorRecord>> GetErrorsBySeverityAsync(
            ErrorSeverity severity, 
            DateTime startDate, 
            DateTime endDate, 
            int pageNumber = 1, 
            int pageSize = 20);

        /// <summary>
        /// Gets errors by type in the specified time period.
        /// </summary>
        /// <param name="errorType">Error type</param>
        /// <param name="startDate">Start date for the period</param>
        /// <param name="endDate">End date for the period</param>
        /// <param name="pageNumber">Page number for pagination</param>
        /// <param name="pageSize">Page size for pagination</param>
        /// <returns>Paginated list of errors</returns>
        Task<PaginatedResponse<ErrorRecord>> GetErrorsByTypeAsync(
            string errorType, 
            DateTime startDate, 
            DateTime endDate, 
            int pageNumber = 1, 
            int pageSize = 20);

        /// <summary>
        /// Gets error trends over time.
        /// </summary>
        /// <param name="startDate">Start date for the period</param>
        /// <param name="endDate">End date for the period</param>
        /// <param name="interval">Time interval for grouping (hour, day, week, month)</param>
        /// <returns>Error trends data</returns>
        Task<List<ErrorTrend>> GetErrorTrendsAsync(DateTime startDate, DateTime endDate, string interval = "day");

        /// <summary>
        /// Checks if error thresholds have been exceeded and should trigger alerts.
        /// </summary>
        /// <param name="timeWindow">Time window to check (in minutes)</param>
        /// <returns>List of triggered alerts</returns>
        Task<List<ErrorAlert>> CheckErrorThresholdsAsync(int timeWindow = 60);

        /// <summary>
        /// Gets error details by correlation ID.
        /// </summary>
        /// <param name="correlationId">Correlation ID to search for</param>
        /// <returns>Error record if found</returns>
        Task<ErrorRecord?> GetErrorByCorrelationIdAsync(string correlationId);

        /// <summary>
        /// Cleans up old error records based on retention policy.
        /// </summary>
        /// <param name="retentionDays">Number of days to retain error records</param>
        /// <returns>Number of records cleaned up</returns>
        Task<int> CleanupOldErrorsAsync(int retentionDays = 30);
    }

    /// <summary>
    /// Context information for error recording.
    /// </summary>
    public class ErrorContext
    {
        /// <summary>
        /// Request path
        /// </summary>
        public string? Path { get; set; }

        /// <summary>
        /// HTTP method
        /// </summary>
        public string? Method { get; set; }

        /// <summary>
        /// User ID
        /// </summary>
        public string? UserId { get; set; }

        /// <summary>
        /// User agent
        /// </summary>
        public string? UserAgent { get; set; }

        /// <summary>
        /// Client IP address
        /// </summary>
        public string? ClientIp { get; set; }

        /// <summary>
        /// Request duration in milliseconds
        /// </summary>
        public long? RequestDurationMs { get; set; }

        /// <summary>
        /// Additional context data
        /// </summary>
        public Dictionary<string, object>? AdditionalData { get; set; }
    }

    /// <summary>
    /// Error statistics for a time period.
    /// </summary>
    public class ErrorStatistics
    {
        /// <summary>
        /// Total number of errors
        /// </summary>
        public int TotalErrors { get; set; }

        /// <summary>
        /// Number of errors by severity
        /// </summary>
        public Dictionary<ErrorSeverity, int> ErrorsBySeverity { get; set; } = new();

        /// <summary>
        /// Number of errors by type
        /// </summary>
        public Dictionary<string, int> ErrorsByType { get; set; } = new();

        /// <summary>
        /// Number of errors by status code
        /// </summary>
        public Dictionary<int, int> ErrorsByStatusCode { get; set; } = new();

        /// <summary>
        /// Average error rate per hour
        /// </summary>
        public double AverageErrorRatePerHour { get; set; }

        /// <summary>
        /// Peak error rate per hour
        /// </summary>
        public double PeakErrorRatePerHour { get; set; }

        /// <summary>
        /// Number of unique users affected
        /// </summary>
        public int UniqueUsersAffected { get; set; }

        /// <summary>
        /// Number of retryable errors
        /// </summary>
        public int RetryableErrors { get; set; }

        /// <summary>
        /// Time period start
        /// </summary>
        public DateTime PeriodStart { get; set; }

        /// <summary>
        /// Time period end
        /// </summary>
        public DateTime PeriodEnd { get; set; }
    }

    /// <summary>
    /// Frequent error information.
    /// </summary>
    public class FrequentError
    {
        /// <summary>
        /// Error type
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Error code
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Error message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Number of occurrences
        /// </summary>
        public int OccurrenceCount { get; set; }

        /// <summary>
        /// Percentage of total errors
        /// </summary>
        public double Percentage { get; set; }

        /// <summary>
        /// First occurrence
        /// </summary>
        public DateTime FirstOccurrence { get; set; }

        /// <summary>
        /// Last occurrence
        /// </summary>
        public DateTime LastOccurrence { get; set; }

        /// <summary>
        /// Average time between occurrences (in minutes)
        /// </summary>
        public double AverageTimeBetweenOccurrences { get; set; }
    }

    /// <summary>
    /// Error trend data point.
    /// </summary>
    public class ErrorTrend
    {
        /// <summary>
        /// Time period start
        /// </summary>
        public DateTime PeriodStart { get; set; }

        /// <summary>
        /// Time period end
        /// </summary>
        public DateTime PeriodEnd { get; set; }

        /// <summary>
        /// Number of errors in this period
        /// </summary>
        public int ErrorCount { get; set; }

        /// <summary>
        /// Error rate per hour
        /// </summary>
        public double ErrorRatePerHour { get; set; }

        /// <summary>
        /// Errors by severity
        /// </summary>
        public Dictionary<ErrorSeverity, int> ErrorsBySeverity { get; set; } = new();
    }

    /// <summary>
    /// Error alert information.
    /// </summary>
    public class ErrorAlert
    {
        /// <summary>
        /// Alert type
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Alert message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Alert severity
        /// </summary>
        public ErrorSeverity Severity { get; set; }

        /// <summary>
        /// Threshold that was exceeded
        /// </summary>
        public int Threshold { get; set; }

        /// <summary>
        /// Actual value that triggered the alert
        /// </summary>
        public int ActualValue { get; set; }

        /// <summary>
        /// Time window for the alert
        /// </summary>
        public int TimeWindowMinutes { get; set; }

        /// <summary>
        /// Alert timestamp
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Error record for storage and retrieval.
    /// </summary>
    public class ErrorRecord
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Error response data
        /// </summary>
        public ErrorResponse ErrorResponse { get; set; } = new();

        /// <summary>
        /// Error context
        /// </summary>
        public ErrorContext Context { get; set; } = new();

        /// <summary>
        /// Timestamp when the error was recorded
        /// </summary>
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Environment where the error occurred
        /// </summary>
        public string Environment { get; set; } = string.Empty;

        /// <summary>
        /// Application version
        /// </summary>
        public string? ApplicationVersion { get; set; }
    }
}

