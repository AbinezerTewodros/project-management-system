using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.AccessLogService
{
    public interface IAccessLogService
    {
        Task LogAccessAsync(string userId, string userEmail, string action, string status, 
            string endpoint = null, string httpMethod = null, int? httpStatusCode = null, 
            string errorMessage = null, string userRole = null, string department = null);

        Task LogLoginAsync(string userId, string userEmail, string status, string errorMessage = null);

        Task LogLogoutAsync(string userId, string userEmail, TimeSpan sessionDuration);

        Task LogApiAccessAsync(string userId, string endpoint, string httpMethod, int httpStatusCode, 
            string requestUrl = null, string requestBody = null);

        Task LogFileAccessAsync(string userId, string action, string fileName, string status, 
            string errorMessage = null);

        Task<List<AccessLog>> GetAccessLogsAsync(string userId = null, string action = null, 
            string status = null, DateTime? fromDate = null, DateTime? toDate = null, 
            int pageNumber = 1, int pageSize = 20);

        Task<List<AccessLog>> GetSuspiciousActivityAsync(DateTime? fromDate = null, DateTime? toDate = null);

        Task<AccessLog> GetAccessLogByIdAsync(int id);

        Task<List<AccessLog>> GetUserAccessHistoryAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null);

        Task<List<AccessLog>> GetFailedLoginAttemptsAsync(string userEmail = null, DateTime? fromDate = null, DateTime? toDate = null);
    }
}

