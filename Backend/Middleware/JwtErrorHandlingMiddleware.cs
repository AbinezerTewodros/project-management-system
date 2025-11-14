using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OpenQA.Selenium;

namespace ProjectManagementSystem1.Middleware
{
    public class JwtErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtErrorHandlingMiddleware> _logger;

        public JwtErrorHandlingMiddleware(RequestDelegate next, ILogger<JwtErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred.");
                context.Response.ContentType = "application/json";

                var statusCode = ex switch
                {
                    UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                    ArgumentException or
                    InvalidOperationException => (int)HttpStatusCode.BadRequest, // Add our validation exceptions
                    KeyNotFoundException or
                    NotFoundException => (int)HttpStatusCode.NotFound,
                    _ => (int)HttpStatusCode.InternalServerError
                };

                var errorResponse = new
                {
                    error = ex.GetType().Name,
                    message = ex.Message,
                    statusCode,
                    stackTrace = context.RequestServices.GetService<IWebHostEnvironment>().IsDevelopment()
                        ? ex.StackTrace
                        : null
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
            }
        }

    }

    public static class JwtErrorHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseJwtErrorHandling(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<JwtErrorHandlingMiddleware>();
        }
    }
}﻿
