using Microsoft.AspNetCore.Http;
using ProjectManagementSystem1.Services.AccessLogService;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Middleware
{
    public class AccessLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public AccessLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip logging for certain paths
            if (ShouldSkipLogging(context.Request.Path))
            {
                await _next(context);
                return;
            }

            var startTime = DateTime.UtcNow;
            var originalBodyStream = context.Response.Body;

            // Get user information
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userEmail = context.User?.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = context.User?.FindFirst(ClaimTypes.Role)?.Value;
            var department = context.User?.FindFirst("Department")?.Value;

            try
            {
                // Continue to the next middleware
                await _next(context);
            }
            finally
            {
                // Log the API access
                var endTime = DateTime.UtcNow;
                var duration = endTime - startTime;

                // Only log if we have a user (authenticated requests)
                if (!string.IsNullOrEmpty(userId))
                {
                    try
                    {
                        // Resolve the service from the request scope
                        var accessLogService = context.RequestServices.GetService<IAccessLogService>();
                        if (accessLogService != null)
                        {
                            await accessLogService.LogApiAccessAsync(
                                userId: userId,
                                endpoint: context.Request.Path,
                                httpMethod: context.Request.Method,
                                httpStatusCode: context.Response.StatusCode,
                                requestUrl: $"{context.Request.Scheme}://{context.Request.Host}{context.Request.Path}{context.Request.QueryString}",
                                requestBody: null // Don't log request body for security reasons
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        // Don't let logging errors break the request
                        Console.WriteLine($"Error logging API access: {ex.Message}");
                    }
                }
            }
        }

        private bool ShouldSkipLogging(PathString path)
        {
            var pathValue = path.Value?.ToLowerInvariant();
            
            // Skip logging for these paths
            return pathValue != null && (
                pathValue.StartsWith("/swagger") ||
                pathValue.StartsWith("/health") ||
                pathValue.StartsWith("/favicon.ico") ||
                pathValue.StartsWith("/_framework") ||
                pathValue.StartsWith("/css") ||
                pathValue.StartsWith("/js") ||
                pathValue.StartsWith("/images") ||
                pathValue.StartsWith("/lib") ||
                pathValue == "/" ||
                pathValue == "/index.html"
            );
        }
    }
}
