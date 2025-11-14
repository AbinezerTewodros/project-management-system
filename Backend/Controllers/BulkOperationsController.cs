using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.BulkOperations;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Services;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BulkOperationsController : ControllerBase
    {
        private readonly IBulkOperationsService _bulkOperationsService;
        private readonly ILogger<BulkOperationsController> _logger;

        public BulkOperationsController(
            IBulkOperationsService bulkOperationsService,
            ILogger<BulkOperationsController> logger)
        {
            _bulkOperationsService = bulkOperationsService;
            _logger = logger;
        }

        #region Project Task Bulk Operations

        [HttpPost("project-tasks/update")]
        public async Task<IActionResult> BulkUpdateProjectTasks([FromBody] List<BulkProjectTaskUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateProjectTasksAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk update job queued successfully. Job ID: {jobId}. Processing {updates.Count} tasks."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project task update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk update job"));
            }
        }

        [HttpPost("project-tasks/delete")]
        public async Task<IActionResult> BulkDeleteProjectTasks([FromBody] List<int> taskIds)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkDeleteProjectTasksAsync(taskIds, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk deletion job queued successfully. Job ID: {jobId}. Processing {taskIds.Count} tasks."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project task deletion job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk deletion job"));
            }
        }

        [HttpPost("project-tasks/assign")]
        public async Task<IActionResult> BulkAssignProjectTasks([FromBody] List<BulkTaskAssignmentDto> assignments)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkAssignProjectTasksAsync(assignments, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk assignment job queued successfully. Job ID: {jobId}. Processing {assignments.Count} assignments."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project task assignment job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk assignment job"));
            }
        }

        [HttpPost("project-tasks/status")]
        public async Task<IActionResult> BulkUpdateTaskStatus([FromBody] List<BulkTaskStatusUpdateDto> statusUpdates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateTaskStatusAsync(statusUpdates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk status update job queued successfully. Job ID: {jobId}. Processing {statusUpdates.Count} status updates."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk task status update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk status update job"));
            }
        }

        #endregion

        #region Project Bulk Operations

        [HttpPost("projects/update")]
        public async Task<IActionResult> BulkUpdateProjects([FromBody] List<BulkProjectUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateProjectsAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk project update job queued successfully. Job ID: {jobId}. Processing {updates.Count} projects."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk project update job"));
            }
        }

        [HttpPost("projects/archive")]
        public async Task<IActionResult> BulkArchiveProjects([FromBody] List<int> projectIds)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkArchiveProjectsAsync(projectIds, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk project archive job queued successfully. Job ID: {jobId}. Processing {projectIds.Count} projects."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project archive job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk project archive job"));
            }
        }

        [HttpPost("projects/assign-members")]
        public async Task<IActionResult> BulkAssignProjectMembers([FromBody] List<BulkProjectAssignmentDto> assignments)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkAssignProjectMembersAsync(assignments, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk project member assignment job queued successfully. Job ID: {jobId}. Processing {assignments.Count} assignments."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk project member assignment job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk project member assignment job"));
            }
        }

        #endregion

        #region Issue Bulk Operations

        [HttpPost("issues/update")]
        public async Task<IActionResult> BulkUpdateIssues([FromBody] List<BulkIssueUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateIssuesAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk issue update job queued successfully. Job ID: {jobId}. Processing {updates.Count} issues."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk issue update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk issue update job"));
            }
        }

        [HttpPost("issues/assign")]
        public async Task<IActionResult> BulkAssignIssues([FromBody] List<BulkIssueAssignmentDto> assignments)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkAssignIssuesAsync(assignments, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk issue assignment job queued successfully. Job ID: {jobId}. Processing {assignments.Count} assignments."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk issue assignment job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk issue assignment job"));
            }
        }

        [HttpPost("issues/status")]
        public async Task<IActionResult> BulkUpdateIssueStatus([FromBody] List<BulkIssueStatusUpdateDto> statusUpdates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateIssueStatusAsync(statusUpdates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk issue status update job queued successfully. Job ID: {jobId}. Processing {statusUpdates.Count} status updates."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk issue status update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk issue status update job"));
            }
        }

        #endregion

        #region Personal Todo Bulk Operations

        [HttpPost("personal-todos/update")]
        public async Task<IActionResult> BulkUpdatePersonalTodos([FromBody] List<BulkPersonalTodoUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdatePersonalTodosAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk personal todo update job queued successfully. Job ID: {jobId}. Processing {updates.Count} todos."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk personal todo update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk personal todo update job"));
            }
        }

        [HttpPost("personal-todos/complete")]
        public async Task<IActionResult> BulkCompletePersonalTodos([FromBody] List<int> todoIds)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkCompletePersonalTodosAsync(todoIds, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk personal todo completion job queued successfully. Job ID: {jobId}. Processing {todoIds.Count} todos."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk personal todo completion job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk personal todo completion job"));
            }
        }

        [HttpPost("personal-todos/delete")]
        public async Task<IActionResult> BulkDeletePersonalTodos([FromBody] List<int> todoIds)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkDeletePersonalTodosAsync(todoIds, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk personal todo deletion job queued successfully. Job ID: {jobId}. Processing {todoIds.Count} todos."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk personal todo deletion job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk personal todo deletion job"));
            }
        }

        #endregion

        #region Independent Task Bulk Operations

        [HttpPost("independent-tasks/update")]
        public async Task<IActionResult> BulkUpdateIndependentTasks([FromBody] List<BulkIndependentTaskUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateIndependentTasksAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk independent task update job queued successfully. Job ID: {jobId}. Processing {updates.Count} tasks."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk independent task update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk independent task update job"));
            }
        }

        [HttpPost("independent-tasks/assign")]
        public async Task<IActionResult> BulkAssignIndependentTasks([FromBody] List<BulkIndependentTaskAssignmentDto> assignments)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkAssignIndependentTasksAsync(assignments, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk independent task assignment job queued successfully. Job ID: {jobId}. Processing {assignments.Count} assignments."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk independent task assignment job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk independent task assignment job"));
            }
        }

        #endregion

        #region User Bulk Operations

        [HttpPost("users/roles")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkUpdateUserRoles([FromBody] List<BulkUserRoleUpdateDto> updates)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkUpdateUserRolesAsync(updates, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk user role update job queued successfully. Job ID: {jobId}. Processing {updates.Count} users."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk user role update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk user role update job"));
            }
        }

        [HttpPost("users/deactivate")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkDeactivateUsers([FromBody] List<string> userIds)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkDeactivateUsersAsync(userIds, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk user deactivation job queued successfully. Job ID: {jobId}. Processing {userIds.Count} users."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk user deactivation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk user deactivation job"));
            }
        }

        #endregion

        #region Generic Bulk Operations

        [HttpPost("export")]
        public async Task<IActionResult> BulkExportData([FromBody] BulkExportRequestDto<object> request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkExportDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk export job queued successfully. Job ID: {jobId}. Export type: {request.ExportType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk export job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk export job"));
            }
        }

        [HttpPost("import")]
        public async Task<IActionResult> BulkImportData([FromBody] BulkImportRequestDto<object> request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _bulkOperationsService.BulkImportDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk import job queued successfully. Job ID: {jobId}. Import type: {request.ImportType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk import job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk import job"));
            }
        }

        #endregion

        #region Job Management

        [HttpGet("jobs/{jobId}/status")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            try
            {
                var status = await _bulkOperationsService.GetBulkJobStatusAsync(jobId);
                return Ok(ApiResponse<BulkJobStatusDto>.CreateSuccess(status, "Job status retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job status for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<BulkJobStatusDto>.CreateError("Failed to get job status"));
            }
        }

        [HttpGet("jobs/{jobId}/results")]
        public async Task<IActionResult> GetJobResults(string jobId)
        {
            try
            {
                var results = await _bulkOperationsService.GetBulkJobResultsAsync(jobId);
                return Ok(ApiResponse<BulkOperationResponse<object>>.CreateSuccess(results, "Job results retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job results for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<BulkOperationResponse<object>>.CreateError("Failed to get job results"));
            }
        }

        [HttpDelete("jobs/{jobId}")]
        public async Task<IActionResult> CancelJob(string jobId)
        {
            try
            {
                var cancelled = await _bulkOperationsService.CancelBulkJobAsync(jobId);
                if (cancelled)
                {
                    return Ok(ApiResponse<bool>.CreateSuccess(true, $"Job {jobId} cancelled successfully"));
                }
                else
                {
                    return BadRequest(ApiResponse<bool>.CreateError($"Failed to cancel job {jobId}"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel job {JobId}", jobId);
                return StatusCode(500, ApiResponse<bool>.CreateError("Failed to cancel job"));
            }
        }

        #endregion
    }
}
