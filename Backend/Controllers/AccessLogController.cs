using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AccessLogService;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Policy = "AdminOnly")]
    public class AccessLogController : ControllerBase
    {
        private readonly IAccessLogService _accessLogService;

        public AccessLogController(IAccessLogService accessLogService)
        {
            _accessLogService = accessLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccessLogs(
            [FromQuery] string? userId = null,
            [FromQuery] string? action = null,
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var logs = await _accessLogService.GetAccessLogsAsync(
                    userId, action, status, fromDate, toDate, pageNumber, pageSize);
                
                return Ok(new { 
                    success = true, 
                    data = logs,
                    pageNumber,
                    pageSize,
                    totalCount = logs.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error retrieving access logs",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("failed-logins")]
        public async Task<IActionResult> GetFailedLoginAttempts(
            [FromQuery] string? userEmail = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var failedLogins = await _accessLogService.GetFailedLoginAttemptsAsync(
                    userEmail, fromDate, toDate);
                
                return Ok(new { 
                    success = true, 
                    data = failedLogins,
                    count = failedLogins.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error retrieving failed login attempts",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("suspicious-activity")]
        public async Task<IActionResult> GetSuspiciousActivity(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var suspiciousActivity = await _accessLogService.GetSuspiciousActivityAsync(
                    fromDate, toDate);
                
                return Ok(new { 
                    success = true, 
                    data = suspiciousActivity,
                    count = suspiciousActivity.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error retrieving suspicious activity",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccessLogById(int id)
        {
            try
            {
                var log = await _accessLogService.GetAccessLogByIdAsync(id);
                
                if (log == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Access log not found" 
                    });
                }
                
                return Ok(new { 
                    success = true, 
                    data = log 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error retrieving access log",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserAccessHistory(
            string userId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var history = await _accessLogService.GetUserAccessHistoryAsync(
                    userId, fromDate, toDate);
                
                return Ok(new { 
                    success = true, 
                    data = history,
                    userId,
                    count = history.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error retrieving user access history",
                    error = ex.Message 
                });
            }
        }
    }
}
