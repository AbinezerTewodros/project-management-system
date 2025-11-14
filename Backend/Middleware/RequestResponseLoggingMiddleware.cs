using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProjectManagementSystem1.Configuration;
using ProjectManagementSystem1.Model.Logging;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ProjectManagementSystem1.Middleware
{
    /// <summary>
    /// Enhanced middleware for logging HTTP requests and responses with structured data,
    /// performance metrics, user context, and configurable options.
    /// </summary>
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;
        private readonly LoggingOptions _options;

        public RequestResponseLoggingMiddleware(
            RequestDelegate next, 
            ILogger<RequestResponseLoggingMiddleware> logger,
            IOptions<LoggingOptions> options)
        {
            _next = next;
            _logger = logger;
            _options = options.Value;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if logging is enabled and request should be logged
            if (!_options.EnableLogging || ShouldSkipLogging(context))
            {
                await _next(context);
                return;
            }

            var correlationId = GetOrCreateCorrelationId(context);
            context.Items["CorrelationId"] = correlationId;

            // Add correlation ID to response headers if enabled and not already present
            if (_options.IncludeCorrelationIdInHeaders && !context.Response.Headers.ContainsKey(_options.CorrelationIdHeaderName))
            {
                context.Response.Headers[_options.CorrelationIdHeaderName] = correlationId;
            }

            var stopwatch = Stopwatch.StartNew();
            var requestData = await CaptureRequestData(context, correlationId);
            
            // Log request
            LogRequest(requestData);

            // Capture the original response body stream
            var originalBodyStream = context.Response.Body;
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream;

            Exception? exception = null;
            string responseBody = string.Empty;
            
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                exception = ex;
                throw;
            }
            finally
            {
                stopwatch.Stop();

                try
                {
                    // Read the response body safely
                    if (memoryStream.CanRead && memoryStream.Length > 0)
                    {
                        memoryStream.Position = 0;
                        using var reader = new StreamReader(memoryStream, leaveOpen: true);
                        responseBody = await reader.ReadToEndAsync();
                    }

                    // Copy the response back to the original stream safely
                    if (memoryStream.CanRead)
                    {
                        memoryStream.Position = 0;
                        await memoryStream.CopyToAsync(originalBodyStream);
                    }
                }
                catch (Exception streamEx)
                {
                    _logger.LogWarning(streamEx, "Error reading response body for logging");
                }
                finally
                {
                    // Restore the original stream
                    context.Response.Body = originalBodyStream;
                }

                var responseData = await CaptureResponseData(context, correlationId, stopwatch.ElapsedMilliseconds, responseBody, exception);
                
                // Log response
                LogResponse(responseData);
            }
        }

        private bool ShouldSkipLogging(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant();
            var method = context.Request.Method.ToUpperInvariant();

            // Skip excluded paths
            if (!string.IsNullOrEmpty(path) && _options.ExcludedPaths.Any(excludedPath => 
                path.StartsWith(excludedPath.ToLowerInvariant())))
            {
                return true;
            }

            // Skip excluded methods
            if (_options.ExcludedMethods.Contains(method))
            {
                return true;
            }

            return false;
        }

        private string GetOrCreateCorrelationId(HttpContext context)
        {
            // Check if correlation ID is already provided in headers
            var existingCorrelationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ??
                                       context.Request.Headers["X-Request-ID"].FirstOrDefault();

            return existingCorrelationId ?? Guid.NewGuid().ToString();
        }

        private async Task<RequestLogData> CaptureRequestData(HttpContext context, string correlationId)
        {
            var request = context.Request;
            var requestBody = await GetRequestBody(request);

            return new RequestLogData
            {
                CorrelationId = correlationId,
                Method = request.Method,
                Path = request.Path,
                Url = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}",
                QueryString = request.QueryString.ToString(),
                Headers = GetFilteredHeaders(request.Headers),
                Body = _options.LogRequestBodies ? MaskSensitiveData(requestBody) : null,
                BodySize = requestBody?.Length ?? 0,
                ContentType = request.ContentType,
                UserAgent = request.Headers["User-Agent"].FirstOrDefault(),
                ClientIp = GetClientIpAddress(context),
                User = _options.IncludeUserContext ? GetUserContext(context) : null,
                Timestamp = DateTime.UtcNow
            };
        }

        private async Task<ResponseLogData> CaptureResponseData(
            HttpContext context, 
            string correlationId, 
            long durationMs, 
            string responseBody, 
            Exception? exception)
        {
            var response = context.Response;
            var request = context.Request;

            return new ResponseLogData
            {
                CorrelationId = correlationId,
                Method = request.Method,
                Path = request.Path,
                StatusCode = response.StatusCode,
                StatusDescription = GetStatusDescription(response.StatusCode),
                Headers = GetFilteredHeaders(response.Headers),
                Body = _options.LogResponseBodies ? MaskSensitiveData(responseBody) : null,
                BodySize = responseBody?.Length ?? 0,
                ContentType = response.ContentType,
                DurationMs = durationMs,
                IsSuccess = response.StatusCode >= 200 && response.StatusCode < 300,
                Error = exception != null ? new ErrorInfo
                {
                    Message = exception.Message,
                    Type = exception.GetType().Name,
                    StackTrace = exception.StackTrace,
                    Details = new { exception.Source, exception.HResult }
                } : null,
                Timestamp = DateTime.UtcNow
            };
        }

        private async Task<string> GetRequestBody(HttpRequest request)
        {
            if (request.Body == null || !request.Body.CanRead)
                return string.Empty;

            // Enable buffering so we can read the body multiple times
            request.EnableBuffering();

            using var reader = new StreamReader(
                request.Body,
                encoding: Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                leaveOpen: true);

            var body = await reader.ReadToEndAsync();
            request.Body.Position = 0; // Reset position for other middleware

            // Check body size limit
            if (body.Length > _options.MaxBodySize)
            {
                return $"[BODY TOO LARGE - {body.Length} bytes, limit: {_options.MaxBodySize} bytes]";
            }

            return body;
        }

        private Dictionary<string, string> GetFilteredHeaders(IHeaderDictionary headers)
        {
            var filteredHeaders = new Dictionary<string, string>();

            foreach (var header in headers)
            {
                if (!_options.ExcludedHeaders.Contains(header.Key, StringComparer.OrdinalIgnoreCase))
                {
                    var value = _options.MaskSensitiveData ? 
                        MaskSensitiveData(header.Value.ToString()) : 
                        header.Value.ToString();
                    filteredHeaders[header.Key] = value;
                }
            }

            return filteredHeaders;
        }

        private string? GetClientIpAddress(HttpContext context)
        {
            return context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   context.Request.Headers["X-Real-IP"].FirstOrDefault() ??
                   context.Connection.RemoteIpAddress?.ToString();
        }

        private UserContext? GetUserContext(HttpContext context)
        {
            var user = context.User;
            if (user?.Identity?.IsAuthenticated != true)
                return null;

            return new UserContext
            {
                Id = user.FindFirstValue(ClaimTypes.NameIdentifier),
                Username = user.FindFirstValue(ClaimTypes.Name),
                Email = user.FindFirstValue(ClaimTypes.Email),
                Roles = user.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList(),
                Department = user.FindFirstValue("Department"),
                IsAuthenticated = true
            };
        }

        private string GetStatusDescription(int statusCode)
        {
            return statusCode switch
            {
                200 => "OK",
                201 => "Created",
                204 => "No Content",
                400 => "Bad Request",
                401 => "Unauthorized",
                403 => "Forbidden",
                404 => "Not Found",
                500 => "Internal Server Error",
                _ => "Unknown"
            };
        }

        private string MaskSensitiveData(string input)
        {
            if (string.IsNullOrEmpty(input) || !_options.MaskSensitiveData)
                return input;

            var masked = input;

            foreach (var pattern in _options.SensitiveDataPatterns)
            {
                var regex = new Regex($@"""{pattern}""\s*:\s*""([^""]+)""", RegexOptions.IgnoreCase);
                masked = regex.Replace(masked, match =>
                {
                    var value = match.Groups[1].Value;
                    if (value.Length <= _options.UnmaskedPrefixLength + _options.UnmaskedSuffixLength)
                        return $@"""{pattern}"" : ""{new string(_options.MaskCharacter, value.Length)}""";

                    var prefix = value.Substring(0, _options.UnmaskedPrefixLength);
                    var suffix = value.Substring(value.Length - _options.UnmaskedSuffixLength);
                    var maskedPart = new string(_options.MaskCharacter, value.Length - _options.UnmaskedPrefixLength - _options.UnmaskedSuffixLength);

                    return $@"""{pattern}"" : ""{prefix}{maskedPart}{suffix}""";
                });
            }

            return masked;
        }

        private void LogRequest(RequestLogData requestData)
        {
            var logLevel = _options.RequestLogLevel;
            var message = "HTTP Request: {Method} {Path} | CorrelationId: {CorrelationId} | User: {User} | IP: {IP}";

            _logger.Log(logLevel, message,
                requestData.Method,
                requestData.Path,
                requestData.CorrelationId,
                requestData.User?.Username ?? "Anonymous",
                requestData.ClientIp ?? "Unknown");

            // Log structured data at debug level
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                var jsonData = JsonSerializer.Serialize(requestData, new JsonSerializerOptions 
                { 
                    WriteIndented = false,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                _logger.LogDebug("Request Details: {RequestData}", jsonData);
            }
        }

        private void LogResponse(ResponseLogData responseData)
        {
            var logLevel = responseData.IsSuccess ? _options.ResponseLogLevel : _options.ErrorLogLevel;
            var message = "HTTP Response: {Method} {Path} | CorrelationId: {CorrelationId} | Status: {StatusCode} | Duration: {Duration}ms";

            _logger.Log(logLevel, message,
                responseData.Method ?? "Unknown",
                responseData.Path ?? "Unknown",
                responseData.CorrelationId,
                responseData.StatusCode,
                responseData.DurationMs);

            // Log error details if present
            if (responseData.Error != null)
            {
                _logger.Log(_options.ErrorLogLevel, "Request failed: {Error}", 
                    JsonSerializer.Serialize(responseData.Error, new JsonSerializerOptions 
                    { 
                        WriteIndented = false,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }));
            }

            // Log structured data at debug level
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                var jsonData = JsonSerializer.Serialize(responseData, new JsonSerializerOptions 
                { 
                    WriteIndented = false,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                _logger.LogDebug("Response Details: {ResponseData}", jsonData);
            }
        }
    }

    /// <summary>
    /// Extension methods for registering the enhanced logging middleware.
    /// </summary>
    public static class RequestResponseLoggingMiddlewareExtensions
    {
        /// <summary>
        /// Adds the enhanced request/response logging middleware to the application pipeline.
        /// </summary>
        /// <param name="builder">The application builder</param>
        /// <returns>The application builder for chaining</returns>
        public static IApplicationBuilder UseRequestResponseLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RequestResponseLoggingMiddleware>();
        }
    }
}
