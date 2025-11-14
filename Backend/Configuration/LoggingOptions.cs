namespace ProjectManagementSystem1.Configuration
{
    /// <summary>
    /// Configuration options for request/response logging middleware.
    /// </summary>
    public class LoggingOptions
    {
        /// <summary>
        /// Whether to enable request/response logging
        /// </summary>
        public bool EnableLogging { get; set; } = true;

        /// <summary>
        /// Whether to log request bodies
        /// </summary>
        public bool LogRequestBodies { get; set; } = true;

        /// <summary>
        /// Whether to log response bodies
        /// </summary>
        public bool LogResponseBodies { get; set; } = true;

        /// <summary>
        /// Maximum size of request/response body to log (in bytes)
        /// </summary>
        public int MaxBodySize { get; set; } = 1024 * 10; // 10KB

        /// <summary>
        /// Whether to log sensitive data (passwords, tokens, etc.)
        /// </summary>
        public bool LogSensitiveData { get; set; } = false;

        /// <summary>
        /// List of headers to exclude from logging
        /// </summary>
        public List<string> ExcludedHeaders { get; set; } = new List<string>
        {
            "Authorization",
            "Cookie",
            "X-API-Key"
        };

        /// <summary>
        /// List of paths to exclude from logging
        /// </summary>
        public List<string> ExcludedPaths { get; set; } = new List<string>
        {
            "/health",
            "/metrics",
            "/favicon.ico"
        };

        /// <summary>
        /// List of HTTP methods to exclude from logging
        /// </summary>
        public List<string> ExcludedMethods { get; set; } = new List<string>();

        /// <summary>
        /// Minimum log level for request logging
        /// </summary>
        public LogLevel RequestLogLevel { get; set; } = LogLevel.Information;

        /// <summary>
        /// Minimum log level for response logging
        /// </summary>
        public LogLevel ResponseLogLevel { get; set; } = LogLevel.Information;

        /// <summary>
        /// Minimum log level for error logging
        /// </summary>
        public LogLevel ErrorLogLevel { get; set; } = LogLevel.Error;

        /// <summary>
        /// Whether to include performance metrics in logs
        /// </summary>
        public bool IncludePerformanceMetrics { get; set; } = true;

        /// <summary>
        /// Whether to include user context in logs
        /// </summary>
        public bool IncludeUserContext { get; set; } = true;

        /// <summary>
        /// Whether to include correlation ID in response headers
        /// </summary>
        public bool IncludeCorrelationIdInHeaders { get; set; } = true;

        /// <summary>
        /// Name of the correlation ID header
        /// </summary>
        public string CorrelationIdHeaderName { get; set; } = "X-Correlation-ID";

        /// <summary>
        /// Whether to mask sensitive data in logs
        /// </summary>
        public bool MaskSensitiveData { get; set; } = true;

        /// <summary>
        /// Patterns to use for masking sensitive data
        /// </summary>
        public List<string> SensitiveDataPatterns { get; set; } = new List<string>
        {
            "password",
            "token",
            "secret",
            "key",
            "authorization"
        };

        /// <summary>
        /// Character to use for masking sensitive data
        /// </summary>
        public char MaskCharacter { get; set; } = '*';

        /// <summary>
        /// Number of characters to show before masking
        /// </summary>
        public int UnmaskedPrefixLength { get; set; } = 2;

        /// <summary>
        /// Number of characters to show after masking
        /// </summary>
        public int UnmaskedSuffixLength { get; set; } = 2;
    }
}

