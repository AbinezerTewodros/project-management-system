using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.BulkOperations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public interface IBulkOperationsService
    {
        // Project Task Bulk Operations
        Task<string> BulkUpdateProjectTasksAsync(List<BulkProjectTaskUpdateDto> updates, string userId);
        Task<string> BulkDeleteProjectTasksAsync(List<int> taskIds, string userId);
        Task<string> BulkAssignProjectTasksAsync(List<BulkTaskAssignmentDto> assignments, string userId);
        Task<string> BulkUpdateTaskStatusAsync(List<BulkTaskStatusUpdateDto> statusUpdates, string userId);

        // Project Bulk Operations
        Task<string> BulkUpdateProjectsAsync(List<BulkProjectUpdateDto> updates, string userId);
        Task<string> BulkArchiveProjectsAsync(List<int> projectIds, string userId);
        Task<string> BulkAssignProjectMembersAsync(List<BulkProjectAssignmentDto> assignments, string userId);

        // Issue Bulk Operations
        Task<string> BulkUpdateIssuesAsync(List<BulkIssueUpdateDto> updates, string userId);
        Task<string> BulkAssignIssuesAsync(List<BulkIssueAssignmentDto> assignments, string userId);
        Task<string> BulkUpdateIssueStatusAsync(List<BulkIssueStatusUpdateDto> statusUpdates, string userId);

        // Personal Todo Bulk Operations
        Task<string> BulkUpdatePersonalTodosAsync(List<BulkPersonalTodoUpdateDto> updates, string userId);
        Task<string> BulkCompletePersonalTodosAsync(List<int> todoIds, string userId);
        Task<string> BulkDeletePersonalTodosAsync(List<int> todoIds, string userId);

        // Independent Task Bulk Operations
        Task<string> BulkUpdateIndependentTasksAsync(List<BulkIndependentTaskUpdateDto> updates, string userId);
        Task<string> BulkAssignIndependentTasksAsync(List<BulkIndependentTaskAssignmentDto> assignments, string userId);

        // User Bulk Operations
        Task<string> BulkUpdateUserRolesAsync(List<BulkUserRoleUpdateDto> updates, string userId);
        Task<string> BulkDeactivateUsersAsync(List<string> userIds, string userId);

        // Generic Bulk Operations
        Task<string> BulkExportDataAsync<T>(BulkExportRequestDto<T> request, string userId) where T : class;
        Task<string> BulkImportDataAsync<T>(BulkImportRequestDto<T> request, string userId) where T : class;

        // Job Status and Results
        Task<BulkJobStatusDto> GetBulkJobStatusAsync(string jobId);
        Task<BulkOperationResponse<object>> GetBulkJobResultsAsync(string jobId);
        Task<bool> CancelBulkJobAsync(string jobId);
    }
}
