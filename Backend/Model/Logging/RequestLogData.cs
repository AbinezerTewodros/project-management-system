using System.Text.Json.Serialization;

namespace ProjectManagementSystem1.Model.Logging
{
    /// <summary>
    /// Structured data for logging HTTP requests.
    /// </summary>
    public class RequestLogData
    {
        /// <summary>
        /// Unique correlation ID for the request
        /// </summary>
        [JsonPropertyName("correlationId")]
        public string CorrelationId { get; set; } = string.Empty;

        /// <summary>
        /// HTTP method (GET, POST, etc.)
        /// </summary>
        [JsonPropertyName("method")]
        public string Method { get; set; } = string.Empty;

        /// <summary>
        /// Request path
        /// </summary>
        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        /// <summary>
        /// Full request URL
        /// </summary>
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Query string parameters
        /// </summary>
        [JsonPropertyName("queryString")]
        public string QueryString { get; set; } = string.Empty;

        /// <summary>
        /// Request headers (excluding sensitive ones)
        /// </summary>
        [JsonPropertyName("headers")]
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Request body (if applicable and enabled)
        /// </summary>
        [JsonPropertyName("body")]
        public string? Body { get; set; }

        /// <summary>
        /// Size of request body in bytes
        /// </summary>
        [JsonPropertyName("bodySize")]
        public long BodySize { get; set; }

        /// <summary>
        /// Content type of the request
        /// </summary>
        [JsonPropertyName("contentType")]
        public string? ContentType { get; set; }

        /// <summary>
        /// User agent string
        /// </summary>
        [JsonPropertyName("userAgent")]
        public string? UserAgent { get; set; }

        /// <summary>
        /// Client IP address
        /// </summary>
        [JsonPropertyName("clientIp")]
        public string? ClientIp { get; set; }

        /// <summary>
        /// User information (if authenticated)
        /// </summary>
        [JsonPropertyName("user")]
        public UserContext? User { get; set; }

        /// <summary>
        /// Timestamp when the request was received
        /// </summary>
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Structured data for logging HTTP responses.
    /// </summary>
    public class ResponseLogData
    {
        /// <summary>
        /// Unique correlation ID for the request
        /// </summary>
        [JsonPropertyName("correlationId")]
        public string CorrelationId { get; set; } = string.Empty;

        /// <summary>
        /// HTTP method (GET, POST, etc.)
        /// </summary>
        [JsonPropertyName("method")]
        public string Method { get; set; } = string.Empty;

        /// <summary>
        /// Request path
        /// </summary>
        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        /// <summary>
        /// HTTP status code
        /// </summary>
        [JsonPropertyName("statusCode")]
        public int StatusCode { get; set; }

        /// <summary>
        /// HTTP status description
        /// </summary>
        [JsonPropertyName("statusDescription")]
        public string StatusDescription { get; set; } = string.Empty;

        /// <summary>
        /// Response headers
        /// </summary>
        [JsonPropertyName("headers")]
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Response body (if enabled)
        /// </summary>
        [JsonPropertyName("body")]
        public string? Body { get; set; }

        /// <summary>
        /// Size of response body in bytes
        /// </summary>
        [JsonPropertyName("bodySize")]
        public long BodySize { get; set; }

        /// <summary>
        /// Content type of the response
        /// </summary>
        [JsonPropertyName("contentType")]
        public string? ContentType { get; set; }

        /// <summary>
        /// Request duration in milliseconds
        /// </summary>
        [JsonPropertyName("durationMs")]
        public long DurationMs { get; set; }

        /// <summary>
        /// Whether the request was successful (2xx status codes)
        /// </summary>
        [JsonPropertyName("isSuccess")]
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Error information (if any)
        /// </summary>
        [JsonPropertyName("error")]
        public ErrorInfo? Error { get; set; }

        /// <summary>
        /// Timestamp when the response was sent
        /// </summary>
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// User context information for logging.
    /// </summary>
    public class UserContext
    {
        /// <summary>
        /// User ID
        /// </summary>
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        /// <summary>
        /// Username
        /// </summary>
        [JsonPropertyName("username")]
        public string? Username { get; set; }

        /// <summary>
        /// User email
        /// </summary>
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        /// <summary>
        /// User roles
        /// </summary>
        [JsonPropertyName("roles")]
        public List<string> Roles { get; set; } = new List<string>();

        /// <summary>
        /// User department
        /// </summary>
        [JsonPropertyName("department")]
        public string? Department { get; set; }

        /// <summary>
        /// Whether the user is authenticated
        /// </summary>
        [JsonPropertyName("isAuthenticated")]
        public bool IsAuthenticated { get; set; }
    }

    /// <summary>
    /// Error information for logging.
    /// </summary>
    public class ErrorInfo
    {
        /// <summary>
        /// Error message
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Error type/exception name
        /// </summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        /// <summary>
        /// Stack trace (if available)
        /// </summary>
        [JsonPropertyName("stackTrace")]
        public string? StackTrace { get; set; }

        /// <summary>
        /// Additional error details
        /// </summary>
        [JsonPropertyName("details")]
        public object? Details { get; set; }
    }

    /// <summary>
    /// Performance metrics for logging.
    /// </summary>
    public class PerformanceMetrics
    {
        /// <summary>
        /// Total request duration in milliseconds
        /// </summary>
        [JsonPropertyName("totalDurationMs")]
        public long TotalDurationMs { get; set; }

        /// <summary>
        /// Database query duration in milliseconds
        /// </summary>
        [JsonPropertyName("databaseDurationMs")]
        public long? DatabaseDurationMs { get; set; }

        /// <summary>
        /// External service call duration in milliseconds
        /// </summary>
        [JsonPropertyName("externalServiceDurationMs")]
        public long? ExternalServiceDurationMs { get; set; }

        /// <summary>
        /// Memory usage in bytes
        /// </summary>
        [JsonPropertyName("memoryUsageBytes")]
        public long? MemoryUsageBytes { get; set; }

        /// <summary>
        /// CPU usage percentage
        /// </summary>
        [JsonPropertyName("cpuUsagePercentage")]
        public double? CpuUsagePercentage { get; set; }

        /// <summary>
        /// Number of database queries executed
        /// </summary>
        [JsonPropertyName("databaseQueryCount")]
        public int? DatabaseQueryCount { get; set; }

        /// <summary>
        /// Number of external service calls made
        /// </summary>
        [JsonPropertyName("externalServiceCallCount")]
        public int? ExternalServiceCallCount { get; set; }
    }
}

