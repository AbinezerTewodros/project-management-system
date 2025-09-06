namespace ProjectManagementSystem1.Configuration
{
    /// <summary>
    /// Configuration options for background job processing.
    /// </summary>
    public class BackgroundJobOptions
    {
        /// <summary>
        /// Whether background job processing is enabled
        /// </summary>
        public bool EnableBackgroundJobs { get; set; } = true;

        /// <summary>
        /// Maximum number of concurrent jobs
        /// </summary>
        public int MaxConcurrentJobs { get; set; } = 10;

        /// <summary>
        /// Default job timeout in minutes
        /// </summary>
        public int DefaultJobTimeoutMinutes { get; set; } = 30;

        /// <summary>
        /// Maximum retry attempts for failed jobs
        /// </summary>
        public int MaxRetryAttempts { get; set; } = 3;

        /// <summary>
        /// Retry delay in minutes between attempts
        /// </summary>
        public int RetryDelayMinutes { get; set; } = 5;

        /// <summary>
        /// Whether to enable job monitoring
        /// </summary>
        public bool EnableMonitoring { get; set; } = true;

        /// <summary>
        /// Job retention period in days
        /// </summary>
        public int JobRetentionDays { get; set; } = 7;

        /// <summary>
        /// Whether to enable automatic job cleanup
        /// </summary>
        public bool EnableAutoCleanup { get; set; } = true;

        /// <summary>
        /// Database connection string for Hangfire
        /// </summary>
        public string? ConnectionString { get; set; }

        /// <summary>
        /// Whether to enable Hangfire dashboard
        /// </summary>
        public bool EnableDashboard { get; set; } = true;

        /// <summary>
        /// Dashboard authorization roles (comma-separated)
        /// </summary>
        public string DashboardRoles { get; set; } = "Admin";

        /// <summary>
        /// Whether to enable job progress tracking
        /// </summary>
        public bool EnableProgressTracking { get; set; } = true;

        /// <summary>
        /// Whether to enable job cancellation
        /// </summary>
        public bool EnableJobCancellation { get; set; } = true;
    }
}

