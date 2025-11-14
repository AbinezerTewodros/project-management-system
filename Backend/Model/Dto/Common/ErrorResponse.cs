using System.Text.Json.Serialization;

namespace ProjectManagementSystem1.Model.Dto.Common
{
    /// <summary>
    /// Comprehensive error response model for advanced error handling.
    /// </summary>
    public class ErrorResponse
    {
        /// <summary>
        /// Unique error identifier for tracking
        /// </summary>
        [JsonPropertyName("errorId")]
        public string ErrorId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Error type/category
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Error code for programmatic handling
        /// </summary>
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Human-readable error message
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Detailed error description
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// HTTP status code
        /// </summary>
        [JsonPropertyName("statusCode")]
        public int StatusCode { get; set; }

        /// <summary>
        /// Timestamp when the error occurred
        /// </summary>
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Request correlation ID for tracing
        /// </summary>
        [JsonPropertyName("correlationId")]
        public string? CorrelationId { get; set; }

        /// <summary>
        /// Request path that caused the error
        /// </summary>
        [JsonPropertyName("path")]
        public string? Path { get; set; }

        /// <summary>
        /// HTTP method that caused the error
        /// </summary>
        [JsonPropertyName("method")]
        public string? Method { get; set; }

        /// <summary>
        /// User who encountered the error
        /// </summary>
        [JsonPropertyName("userId")]
        public string? UserId { get; set; }

        /// <summary>
        /// Detailed validation errors (if applicable)
        /// </summary>
        [JsonPropertyName("validationErrors")]
        public List<ValidationError>? ValidationErrors { get; set; }

        /// <summary>
        /// Additional error details
        /// </summary>
        [JsonPropertyName("details")]
        public object? Details { get; set; }

        /// <summary>
        /// Stack trace (only in development)
        /// </summary>
        [JsonPropertyName("stackTrace")]
        public string? StackTrace { get; set; }

        /// <summary>
        /// Error severity level
        /// </summary>
        [JsonPropertyName("severity")]
        public ErrorSeverity Severity { get; set; } = ErrorSeverity.Error;

        /// <summary>
        /// Whether the error is retryable
        /// </summary>
        [JsonPropertyName("isRetryable")]
        public bool IsRetryable { get; set; } = false;

        /// <summary>
        /// Suggested retry delay in seconds
        /// </summary>
        [JsonPropertyName("retryAfterSeconds")]
        public int? RetryAfterSeconds { get; set; }

        /// <summary>
        /// Helpful links or documentation
        /// </summary>
        [JsonPropertyName("helpLinks")]
        public List<HelpLink>? HelpLinks { get; set; }

        /// <summary>
        /// Creates a validation error response
        /// </summary>
        public static ErrorResponse ValidationError(string message, List<ValidationError> validationErrors, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "ValidationError",
                Code = "VALIDATION_FAILED",
                Message = message,
                StatusCode = 400,
                CorrelationId = correlationId,
                ValidationErrors = validationErrors,
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        /// <summary>
        /// Creates a not found error response
        /// </summary>
        public static ErrorResponse NotFound(string resourceName, object resourceId, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "NotFound",
                Code = "RESOURCE_NOT_FOUND",
                Message = $"{resourceName} with ID {resourceId} was not found",
                StatusCode = 404,
                CorrelationId = correlationId,
                Details = new { ResourceName = resourceName, ResourceId = resourceId },
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        /// <summary>
        /// Creates an unauthorized error response
        /// </summary>
        public static ErrorResponse Unauthorized(string message, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "Unauthorized",
                Code = "UNAUTHORIZED_ACCESS",
                Message = message,
                StatusCode = 401,
                CorrelationId = correlationId,
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        /// <summary>
        /// Creates a forbidden error response
        /// </summary>
        public static ErrorResponse Forbidden(string message, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "Forbidden",
                Code = "ACCESS_DENIED",
                Message = message,
                StatusCode = 403,
                CorrelationId = correlationId,
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        /// <summary>
        /// Creates a business rule error response
        /// </summary>
        public static ErrorResponse BusinessRule(string ruleCode, string message, object? ruleData = null, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "BusinessRule",
                Code = ruleCode,
                Message = message,
                StatusCode = 400,
                CorrelationId = correlationId,
                Details = ruleData,
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        /// <summary>
        /// Creates a concurrency error response
        /// </summary>
        public static ErrorResponse Concurrency(string resourceName, object resourceId, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "Concurrency",
                Code = "CONCURRENCY_CONFLICT",
                Message = $"Concurrency conflict detected for {resourceName} with ID {resourceId}",
                StatusCode = 409,
                CorrelationId = correlationId,
                Details = new { ResourceName = resourceName, ResourceId = resourceId },
                Severity = ErrorSeverity.Warning,
                IsRetryable = true,
                RetryAfterSeconds = 1
            };
        }

        /// <summary>
        /// Creates a rate limit error response
        /// </summary>
        public static ErrorResponse RateLimit(string resource, int limit, int remaining, DateTime resetTime, string? correlationId = null)
        {
            var retryAfter = (int)(resetTime - DateTime.UtcNow).TotalSeconds;
            return new ErrorResponse
            {
                Type = "RateLimit",
                Code = "RATE_LIMIT_EXCEEDED",
                Message = $"Rate limit exceeded for {resource}",
                StatusCode = 429,
                CorrelationId = correlationId,
                Details = new { Resource = resource, Limit = limit, Remaining = remaining, ResetTime = resetTime },
                Severity = ErrorSeverity.Warning,
                IsRetryable = true,
                RetryAfterSeconds = Math.Max(1, retryAfter)
            };
        }

        /// <summary>
        /// Creates an external service error response
        /// </summary>
        public static ErrorResponse ExternalService(string serviceName, string endpoint, int statusCode, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "ExternalService",
                Code = "EXTERNAL_SERVICE_ERROR",
                Message = $"External service {serviceName} returned status {statusCode}",
                StatusCode = 502,
                CorrelationId = correlationId,
                Details = new { ServiceName = serviceName, Endpoint = endpoint, StatusCode = statusCode },
                Severity = ErrorSeverity.Error,
                IsRetryable = true,
                RetryAfterSeconds = 5
            };
        }

        /// <summary>
        /// Creates a database error response
        /// </summary>
        public static ErrorResponse Database(string operation, string tableName, object entityId, string? correlationId = null)
        {
            return new ErrorResponse
            {
                Type = "Database",
                Code = "DATABASE_ERROR",
                Message = $"Database operation '{operation}' failed for {tableName}",
                StatusCode = 500,
                CorrelationId = correlationId,
                Details = new { Operation = operation, TableName = tableName, EntityId = entityId },
                Severity = ErrorSeverity.Error,
                IsRetryable = true,
                RetryAfterSeconds = 2
            };
        }

        /// <summary>
        /// Creates an internal server error response
        /// </summary>
        public static ErrorResponse InternalServer(string message, string? correlationId = null, bool includeStackTrace = false)
        {
            return new ErrorResponse
            {
                Type = "InternalServer",
                Code = "INTERNAL_SERVER_ERROR",
                Message = message,
                StatusCode = 500,
                CorrelationId = correlationId,
                Severity = ErrorSeverity.Critical,
                IsRetryable = true,
                RetryAfterSeconds = 5,
                StackTrace = includeStackTrace ? Environment.StackTrace : null
            };
        }
    }

    /// <summary>
    /// Validation error details
    /// </summary>
    public class ValidationError
    {
        /// <summary>
        /// Field or property name
        /// </summary>
        [JsonPropertyName("field")]
        public string Field { get; set; } = string.Empty;

        /// <summary>
        /// Error message
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Error code
        /// </summary>
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Attempted value
        /// </summary>
        [JsonPropertyName("attemptedValue")]
        public object? AttemptedValue { get; set; }

        /// <summary>
        /// Validation parameters
        /// </summary>
        [JsonPropertyName("parameters")]
        public Dictionary<string, object>? Parameters { get; set; }
    }

    /// <summary>
    /// Helpful link for error resolution
    /// </summary>
    public class HelpLink
    {
        /// <summary>
        /// Link title
        /// </summary>
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Link URL
        /// </summary>
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Link description
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    /// <summary>
    /// Error severity levels
    /// </summary>
    public enum ErrorSeverity
    {
        /// <summary>
        /// Information level - not an error
        /// </summary>
        Information = 0,

        /// <summary>
        /// Warning level - potential issue
        /// </summary>
        Warning = 1,

        /// <summary>
        /// Error level - operation failed
        /// </summary>
        Error = 2,

        /// <summary>
        /// Critical level - system failure
        /// </summary>
        Critical = 3
    }
}

