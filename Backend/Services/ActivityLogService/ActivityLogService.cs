using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace ProjectManagementSystem1.Services
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ActivityLogService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActivityAsync(string userId, string entityType, int entityId, string actionType, string details = null)
        {
            // Use background job for high-volume activity logging
            if (IsHighVolumeOperation(actionType))
            {
                var httpContext = _httpContextAccessor.HttpContext;
                var logData = new ActivityLogData
                {
                    UserId = userId,
                    EntityType = entityType,
                    EntityId = entityId,
                    ActionType = actionType,
                    Details = details,
                    IpAddress = GetClientIpAddress(httpContext),
                    UserAgent = httpContext?.Request.Headers["User-Agent"].ToString(),
                    SessionId = httpContext?.Session.Id
                };

                BackgroundJob.Enqueue(() => LogActivityInternalAsync(logData));
            }
            else
            {
                // Log immediately for critical operations
                await LogActivityInternalAsync(new ActivityLogData
                {
                    UserId = userId,
                    EntityType = entityType,
                    EntityId = entityId,
                    ActionType = actionType,
                    Details = details,
                    IpAddress = GetClientIpAddress(_httpContextAccessor.HttpContext),
                    UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
                    SessionId = _httpContextAccessor.HttpContext?.Session.Id
                });
            }
        }

        [AutomaticRetry(Attempts = 3)]
        private async Task LogActivityInternalAsync(ActivityLogData logData)
        {
            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = logData.UserId,
                    EntityType = logData.EntityType,
                    EntityId = logData.EntityId,
                    ActionType = logData.ActionType,
                    Details = logData.Details,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = logData.IpAddress,
                    UserAgent = logData.UserAgent,
                    SessionId = logData.SessionId,
                    CreatedBy = logData.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log the error but don't throw to prevent job failure
                // In a production environment, you might want to send this to a monitoring service
                Console.WriteLine($"Failed to log activity: {ex.Message}");
                throw; // Re-throw to trigger Hangfire retry
            }
        }

        private bool IsHighVolumeOperation(string actionType)
        {
            // Define which operations are high-volume and should use background jobs
            var highVolumeActions = new[]
            {
                "Viewed", "Accessed", "Searched", "Filtered", "Exported", "Imported",
                "BulkUpdate", "BulkDelete", "BulkCreate", "Sync", "Refresh"
            };

            return highVolumeActions.Any(action => actionType.Contains(action, StringComparison.OrdinalIgnoreCase));
        }

        // Bulk activity logging for high-performance scenarios
        public async Task<string> LogBulkActivitiesAsync(List<ActivityLogData> logDataList)
        {
            if (logDataList == null || !logDataList.Any())
                return null;

            var jobId = BackgroundJob.Enqueue(() => LogBulkActivitiesInternalAsync(logDataList));
            return jobId;
        }

        [AutomaticRetry(Attempts = 2)]
        private async Task LogBulkActivitiesInternalAsync(List<ActivityLogData> logDataList)
        {
            try
            {
                var activityLogs = logDataList.Select(logData => new ActivityLog
                {
                    UserId = logData.UserId,
                    EntityType = logData.EntityType,
                    EntityId = logData.EntityId,
                    ActionType = logData.ActionType,
                    Details = logData.Details,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = logData.IpAddress,
                    UserAgent = logData.UserAgent,
                    SessionId = logData.SessionId,
                    CreatedBy = logData.UserId,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.ActivityLogs.AddRange(activityLogs);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log bulk activities: {ex.Message}");
                throw; // Re-throw to trigger Hangfire retry
            }
        }

        public async Task LogActivityWithFieldChangesAsync(string userId, string entityType, int entityId, string actionType, 
            string entityName, List<FieldChange> fieldChanges, string details = null)
        {
            // Field changes are always important, so log immediately
            await LogActivityWithFieldChangesInternalAsync(userId, entityType, entityId, actionType, entityName, fieldChanges, details);
        }

        private async Task LogActivityWithFieldChangesInternalAsync(string userId, string entityType, int entityId, string actionType, 
            string entityName, List<FieldChange> fieldChanges, string details = null)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            
            var activityLog = new ActivityLog
            {
                UserId = userId,
                EntityType = entityType,
                EntityId = entityId,
                ActionType = actionType,
                Details = details,
                EntityName = entityName,
                Timestamp = DateTime.UtcNow,
                IpAddress = GetClientIpAddress(httpContext),
                UserAgent = httpContext?.Request.Headers["User-Agent"].ToString(),
                SessionId = httpContext?.Session.Id,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            // Add field changes
            if (fieldChanges != null && fieldChanges.Any())
            {
                foreach (var change in fieldChanges)
                {
                    activityLog.FieldChanges.Add(new ActivityLogFieldChange
                    {
                        FieldName = change.FieldName,
                        OldValue = change.OldValue?.ToString(),
                        NewValue = change.NewValue?.ToString(),
                        FieldType = change.FieldType,
                        ChangedAt = DateTime.UtcNow
                    });
                }
            }

            _context.ActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ActivityLog>> GetActivityLogsAsync(string userId = null, string entityType = null, 
            int? entityId = null, DateTime? fromDate = null, DateTime? toDate = null, int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.ActivityLogs
                .Include(al => al.FieldChanges)
                .AsQueryable();

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(al => al.UserId == userId);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(al => al.EntityType == entityType);

            if (entityId.HasValue)
                query = query.Where(al => al.EntityId == entityId.Value);

            if (fromDate.HasValue)
                query = query.Where(al => al.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(al => al.Timestamp <= toDate.Value);

            return await query
                .OrderByDescending(al => al.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<ActivityLog> GetActivityLogByIdAsync(int id)
        {
            return await _context.ActivityLogs
                .Include(al => al.FieldChanges)
                .FirstOrDefaultAsync(al => al.Id == id);
        }

        private string GetClientIpAddress(HttpContext httpContext)
        {
            if (httpContext == null) return null;

            // Try to get the real IP address from various headers
            var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedHeader))
            {
                return forwardedHeader.Split(',')[0].Trim();
            }

            var realIpHeader = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIpHeader))
            {
                return realIpHeader;
            }

            return httpContext.Connection.RemoteIpAddress?.ToString();
        }
    }

    public class FieldChange
    {
        public string FieldName { get; set; }
        public object OldValue { get; set; }
        public object NewValue { get; set; }
        public string FieldType { get; set; }
    }

    // Data transfer object for background job activity logging
    public class ActivityLogData
    {
        public string UserId { get; set; }
        public string EntityType { get; set; }
        public int EntityId { get; set; }
        public string ActionType { get; set; }
        public string Details { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
        public string SessionId { get; set; }
    }
}