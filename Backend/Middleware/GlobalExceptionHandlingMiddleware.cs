using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProjectManagementSystem1.Configuration;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Exceptions;
using System.Diagnostics;
using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace ProjectManagementSystem1.Middleware
{
    /// <summary>
    /// Global exception handling middleware that catches all unhandled exceptions
    /// and returns standardized error responses with proper logging and categorization.
    /// </summary>
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly LoggingOptions _loggingOptions;

        public GlobalExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionHandlingMiddleware> logger,
            IWebHostEnvironment environment,
            IOptions<LoggingOptions> loggingOptions)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
            _loggingOptions = loggingOptions.Value;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var correlationId = GetCorrelationId(context);
            var errorResponse = CreateErrorResponse(exception, context, correlationId);

            // Log the exception with appropriate level
            LogException(exception, context, correlationId, errorResponse);

            // Set response status code
            context.Response.StatusCode = errorResponse.StatusCode;
            context.Response.ContentType = "application/json";

            // Add retry-after header if applicable
            if (errorResponse.RetryAfterSeconds.HasValue)
            {
                context.Response.Headers["Retry-After"] = errorResponse.RetryAfterSeconds.Value.ToString();
            }

            // Add correlation ID to response headers
            if (!string.IsNullOrEmpty(correlationId))
            {
                context.Response.Headers.TryAdd("X-Correlation-ID", correlationId);
            }

            // Serialize and return the error response
            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            });

            await context.Response.WriteAsync(jsonResponse);
        }

        private string? GetCorrelationId(HttpContext context)
        {
            return context.Items["CorrelationId"]?.ToString() ??
                   context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ??
                   context.Request.Headers["X-Request-ID"].FirstOrDefault();
        }

        private ErrorResponse CreateErrorResponse(Exception exception, HttpContext context, string? correlationId)
        {
            var path = context.Request.Path;
            var method = context.Request.Method;
            var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            // Set common properties
            var errorResponse = new ErrorResponse
            {
                CorrelationId = correlationId,
                Path = path,
                Method = method,
                UserId = userId
            };

            // Handle specific exception types
            switch (exception)
            {
                case ValidationException validationEx:
                    return HandleValidationException(validationEx, errorResponse);

                case NotFoundException notFoundEx:
                    return HandleNotFoundException(notFoundEx, errorResponse);

                case System.UnauthorizedAccessException unauthorizedEx:
                    return HandleUnauthorizedException(unauthorizedEx, errorResponse);

                case HttpRequestException httpEx:
                    return HandleHttpRequestException(httpEx, errorResponse);

                case JsonException jsonEx:
                    return HandleJsonException(jsonEx, errorResponse);

                case InvalidOperationException invalidOpEx:
                    return HandleInvalidOperationException(invalidOpEx, errorResponse);

                case ArgumentException argEx:
                    return HandleArgumentException(argEx, errorResponse);

                case TimeoutException timeoutEx:
                    return HandleTimeoutException(timeoutEx, errorResponse);

                default:
                    return HandleUnexpectedException(exception, errorResponse);
            }
        }

        private ErrorResponse HandleValidationException(ValidationException ex, ErrorResponse baseResponse)
        {
            var validationErrors = ex.ValidationErrors.Select(v => new ValidationError
            {
                Field = v.MemberNames.FirstOrDefault() ?? "Unknown",
                Message = v.ErrorMessage ?? "Validation failed",
                Code = "VALIDATION_ERROR",
                AttemptedValue = null
            }).ToList();

            return ErrorResponse.ValidationError(ex.Message, validationErrors, baseResponse.CorrelationId);
        }

        private ErrorResponse HandleNotFoundException(NotFoundException ex, ErrorResponse baseResponse)
        {
            return ErrorResponse.NotFound(ex.Message, null, baseResponse.CorrelationId);
        }

        private ErrorResponse HandleUnauthorizedException(System.UnauthorizedAccessException ex, ErrorResponse baseResponse)
        {
            return ErrorResponse.Forbidden(ex.Message, baseResponse.CorrelationId);
        }





        private ErrorResponse HandleHttpRequestException(HttpRequestException ex, ErrorResponse baseResponse)
        {
            return new ErrorResponse
            {
                Type = "HttpRequest",
                Code = "HTTP_REQUEST_ERROR",
                Message = "HTTP request failed",
                StatusCode = 502,
                CorrelationId = baseResponse.CorrelationId,
                Details = new { ex.Message },
                Severity = ErrorSeverity.Error,
                IsRetryable = true,
                RetryAfterSeconds = 5
            };
        }

        private ErrorResponse HandleJsonException(JsonException ex, ErrorResponse baseResponse)
        {
            return new ErrorResponse
            {
                Type = "Json",
                Code = "JSON_PARSING_ERROR",
                Message = "Invalid JSON format",
                StatusCode = 400,
                CorrelationId = baseResponse.CorrelationId,
                Details = new { ex.Message, ex.LineNumber, ex.BytePositionInLine },
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        private ErrorResponse HandleInvalidOperationException(InvalidOperationException ex, ErrorResponse baseResponse)
        {
            return new ErrorResponse
            {
                Type = "InvalidOperation",
                Code = "INVALID_OPERATION",
                Message = ex.Message,
                StatusCode = 400,
                CorrelationId = baseResponse.CorrelationId,
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        private ErrorResponse HandleArgumentException(ArgumentException ex, ErrorResponse baseResponse)
        {
            return new ErrorResponse
            {
                Type = "Argument",
                Code = "INVALID_ARGUMENT",
                Message = ex.Message,
                StatusCode = 400,
                CorrelationId = baseResponse.CorrelationId,
                Details = new { ex.ParamName },
                Severity = ErrorSeverity.Warning,
                IsRetryable = false
            };
        }

        private ErrorResponse HandleTimeoutException(TimeoutException ex, ErrorResponse baseResponse)
        {
            return new ErrorResponse
            {
                Type = "Timeout",
                Code = "OPERATION_TIMEOUT",
                Message = "Operation timed out",
                StatusCode = 408,
                CorrelationId = baseResponse.CorrelationId,
                Details = new { ex.Message },
                Severity = ErrorSeverity.Warning,
                IsRetryable = true,
                RetryAfterSeconds = 10
            };
        }

        private ErrorResponse HandleUnexpectedException(Exception ex, ErrorResponse baseResponse)
        {
            var includeStackTrace = _environment.IsDevelopment();
            
            // Enhanced logging with full stack trace
            _logger.LogError(ex, 
                "UNHANDLED EXCEPTION | Type: {ExceptionType} | Message: {Message} | StackTrace: {StackTrace} | InnerException: {InnerException}",
                ex.GetType().FullName,
                ex.Message,
                ex.StackTrace,
                ex.InnerException?.Message ?? "None");
            
            return ErrorResponse.InternalServer(
                "An unexpected error occurred. Please try again later.",
                baseResponse.CorrelationId,
                includeStackTrace);
        }

        private void LogException(Exception exception, HttpContext context, string? correlationId, ErrorResponse errorResponse)
        {
            var logLevel = GetLogLevel(errorResponse.Severity);
            var message = "Unhandled exception occurred | CorrelationId: {CorrelationId} | Path: {Path} | Method: {Method} | User: {User} | Error: {Error}";

            _logger.Log(logLevel, exception, message,
                correlationId ?? "Unknown",
                context.Request.Path,
                context.Request.Method,
                context.User?.Identity?.Name ?? "Anonymous",
                exception.Message);

            // Log additional details for critical errors
            if (errorResponse.Severity == ErrorSeverity.Critical)
            {
                _logger.LogCritical(exception, "Critical error details: {ErrorDetails}", 
                    JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions 
                    { 
                        WriteIndented = false,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }));
            }
        }

        private LogLevel GetLogLevel(ErrorSeverity severity)
        {
            return severity switch
            {
                ErrorSeverity.Information => LogLevel.Information,
                ErrorSeverity.Warning => LogLevel.Warning,
                ErrorSeverity.Error => LogLevel.Error,
                ErrorSeverity.Critical => LogLevel.Critical,
                _ => LogLevel.Error
            };
        }
    }

    /// <summary>
    /// Extension methods for registering the global exception handling middleware.
    /// </summary>
    public static class GlobalExceptionHandlingMiddlewareExtensions
    {
        /// <summary>
        /// Adds the global exception handling middleware to the application pipeline.
        /// </summary>
        /// <param name="builder">The application builder</param>
        /// <returns>The application builder for chaining</returns>
        public static IApplicationBuilder UseGlobalExceptionHandling(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<GlobalExceptionHandlingMiddleware>();
        }
    }
}
