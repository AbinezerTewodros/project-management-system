using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Exceptions;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    /// <summary>
    /// Controller for managing activity logs, providing audit trail functionality
    /// for tracking user actions and system events across the application.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogService _activityLogService;
        private readonly ILogger<ActivityLogController> _logger;

        public ActivityLogController(IActivityLogService activityLogService, ILogger<ActivityLogController> logger)
        {
            _activityLogService = activityLogService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a paginated list of activity logs with optional filtering capabilities.
        /// Only accessible by administrators.
        /// </summary>
        /// <param name="userId">Optional filter by user ID</param>
        /// <param name="entityType">Optional filter by entity type (e.g., "Project", "Task")</param>
        /// <param name="entityId">Optional filter by entity ID</param>
        /// <param name="fromDate">Optional filter for logs from this date</param>
        /// <param name="toDate">Optional filter for logs up to this date</param>
        /// <param name="pageNumber">The page number for pagination (default: 1)</param>
        /// <param name="pageSize">The number of items per page (default: 20, max: 100)</param>
        /// <returns>A paginated list of filtered activity logs</returns>
        /// <response code="200">Returns the paginated activity logs</response>
        /// <response code="400">If pagination parameters are invalid</response>
        /// <response code="403">If the user is not authorized</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        [ProducesResponseType(typeof(ApiResponse<List<ActivityLog>>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetActivityLogs(
            [FromQuery] string userId = null,
            [FromQuery] string entityType = null,
            [FromQuery] int? entityId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                // Validate pagination parameters
                if (pageNumber < 1)
                {
                    return BadRequest(ApiResponse.CreateError("Page number must be greater than 0"));
                }

                if (pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(ApiResponse.CreateError("Page size must be between 1 and 100"));
                }

                var logs = await _activityLogService.GetActivityLogsAsync(
                    userId, entityType, entityId, fromDate, toDate, pageNumber, pageSize);

                var response = new
                {
                    success = true,
                    data = logs,
                    pagination = new
                    {
                        pageNumber,
                        pageSize,
                        totalCount = logs.Count
                    }
                };

                return Ok(ApiResponse<object>.CreateSuccess(response, "Activity logs retrieved successfully"));
            }
            catch (System.UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving activity logs");
                return StatusCode(500, ApiResponse.CreateError("An error occurred while retrieving activity logs"));
            }
        }

        /// <summary>
        /// Retrieves a specific activity log by its unique identifier.
        /// Only accessible by administrators.
        /// </summary>
        /// <param name="id">The unique identifier of the activity log</param>
        /// <returns>The activity log with the specified ID</returns>
        /// <response code="200">Returns the requested activity log</response>
        /// <response code="400">If the activity log ID is invalid</response>
        /// <response code="403">If the user is not authorized</response>
        /// <response code="404">If the activity log was not found</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("{id}")]
        [Authorize(Policy = "AdminOnly")]
        [ProducesResponseType(typeof(ApiResponse<ActivityLog>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetActivityLog(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(ApiResponse.CreateError("Invalid activity log ID"));
                }

                var log = await _activityLogService.GetActivityLogByIdAsync(id);
                if (log == null)
                {
                    return NotFound(ApiResponse.CreateError($"Activity log with ID {id} was not found"));
                }

                return Ok(ApiResponse<ActivityLog>.CreateSuccess(log, "Activity log retrieved successfully"));
            }
            catch (System.UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving activity log {Id}", id);
                return StatusCode(500, ApiResponse.CreateError("An error occurred while retrieving the activity log"));
            }
        }

        /// <summary>
        /// Retrieves activity logs for a specific user with optional date filtering and pagination.
        /// Accessible by administrators and managers.
        /// </summary>
        /// <param name="userId">The unique identifier of the user</param>
        /// <param name="fromDate">Optional filter for logs from this date</param>
        /// <param name="toDate">Optional filter for logs up to this date</param>
        /// <param name="pageNumber">The page number for pagination (default: 1)</param>
        /// <param name="pageSize">The number of items per page (default: 20, max: 100)</param>
        /// <returns>A paginated list of activity logs for the specified user</returns>
        /// <response code="200">Returns the paginated user activity logs</response>
        /// <response code="400">If parameters are invalid</response>
        /// <response code="403">If the user is not authorized</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("user/{userId}")]
        [Authorize(Policy = "AdminOrManager")]
        [ProducesResponseType(typeof(ApiResponse<List<ActivityLog>>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetUserActivityLogs(
            string userId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return BadRequest(ApiResponse.CreateError("User ID is required"));
                }

                // Validate pagination parameters
                if (pageNumber < 1)
                {
                    return BadRequest(ApiResponse.CreateError("Page number must be greater than 0"));
                }

                if (pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(ApiResponse.CreateError("Page size must be between 1 and 100"));
                }

                var logs = await _activityLogService.GetActivityLogsAsync(
                    userId, null, null, fromDate, toDate, pageNumber, pageSize);

                var response = new
                {
                    success = true,
                    data = logs,
                    pagination = new
                    {
                        pageNumber,
                        pageSize,
                        totalCount = logs.Count
                    }
                };

                return Ok(ApiResponse<object>.CreateSuccess(response, $"User activity logs retrieved successfully for user {userId}"));
            }
            catch (System.UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user activity logs for {UserId}", userId);
                return StatusCode(500, ApiResponse.CreateError("An error occurred while retrieving user activity logs"));
            }
        }

        /// <summary>
        /// Retrieves activity logs for a specific entity (e.g., project, task) with optional date filtering and pagination.
        /// Accessible by administrators and managers.
        /// </summary>
        /// <param name="entityType">The type of entity (e.g., "Project", "Task", "User")</param>
        /// <param name="entityId">The unique identifier of the entity</param>
        /// <param name="fromDate">Optional filter for logs from this date</param>
        /// <param name="toDate">Optional filter for logs up to this date</param>
        /// <param name="pageNumber">The page number for pagination (default: 1)</param>
        /// <param name="pageSize">The number of items per page (default: 20, max: 100)</param>
        /// <returns>A paginated list of activity logs for the specified entity</returns>
        /// <response code="200">Returns the paginated entity activity logs</response>
        /// <response code="400">If parameters are invalid</response>
        /// <response code="403">If the user is not authorized</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("entity/{entityType}/{entityId}")]
        [Authorize(Policy = "AdminOrManager")]
        [ProducesResponseType(typeof(ApiResponse<List<ActivityLog>>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetEntityActivityLogs(
            string entityType,
            int entityId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(entityType))
                {
                    return BadRequest(ApiResponse.CreateError("Entity type is required"));
                }

                if (entityId <= 0)
                {
                    return BadRequest(ApiResponse.CreateError("Entity ID must be a positive number"));
                }

                // Validate pagination parameters
                if (pageNumber < 1)
                {
                    return BadRequest(ApiResponse.CreateError("Page number must be greater than 0"));
                }

                if (pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(ApiResponse.CreateError("Page size must be between 1 and 100"));
                }

                var logs = await _activityLogService.GetActivityLogsAsync(
                    null, entityType, entityId, fromDate, toDate, pageNumber, pageSize);

                var response = new
                {
                    success = true,
                    data = logs,
                    pagination = new
                    {
                        pageNumber,
                        pageSize,
                        totalCount = logs.Count
                    }
                };

                return Ok(ApiResponse<object>.CreateSuccess(response, $"Entity activity logs retrieved successfully for {entityType} {entityId}"));
            }
            catch (System.UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving entity activity logs for {EntityType} {EntityId}", entityType, entityId);
                return StatusCode(500, ApiResponse.CreateError("An error occurred while retrieving entity activity logs"));
            }
        }
    }
}