using ProjectManagementSystem1.Model.Entities;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Services
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(string userId, string entityType, int entityId, string actionType, string details = null);
        Task LogActivityWithFieldChangesAsync(string userId, string entityType, int entityId, string actionType, 
            string entityName, List<FieldChange> fieldChanges, string details = null);
        Task<List<ActivityLog>> GetActivityLogsAsync(string userId = null, string entityType = null, 
            int? entityId = null, DateTime? fromDate = null, DateTime? toDate = null, int pageNumber = 1, int pageSize = 20);
        Task<ActivityLog> GetActivityLogByIdAsync(int id);
        
        // Bulk activity logging for high-performance scenarios
        Task<string> LogBulkActivitiesAsync(List<ActivityLogData> logDataList);
    }
}