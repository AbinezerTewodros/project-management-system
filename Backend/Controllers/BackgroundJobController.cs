using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services.BackgroundJobs;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")]
    public class BackgroundJobController : ControllerBase
    {
        private readonly IBackgroundJobService _backgroundJobService;
        private readonly ILogger<BackgroundJobController> _logger;

        public BackgroundJobController(IBackgroundJobService backgroundJobService, ILogger<BackgroundJobController> logger)
        {
            _backgroundJobService = backgroundJobService;
            _logger = logger;
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetJobStatistics()
        {
            try
            {
                var statistics = await _backgroundJobService.GetJobStatisticsAsync();
                return Ok(new { success = true, data = statistics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting job statistics");
                return StatusCode(500, new { success = false, message = "Error retrieving job statistics" });
            }
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                JobStatus? jobStatus = null;
                if (!string.IsNullOrEmpty(status) && Enum.TryParse<JobStatus>(status, true, out var parsedStatus))
                {
                    jobStatus = parsedStatus;
                }

                var jobs = await _backgroundJobService.GetJobsAsync(jobStatus, page, pageSize);
                return Ok(new { success = true, data = jobs, page, pageSize });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting jobs");
                return StatusCode(500, new { success = false, message = "Error retrieving jobs" });
            }
        }

        [HttpGet("failed-jobs")]
        public async Task<IActionResult> GetFailedJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var jobs = await _backgroundJobService.GetFailedJobsAsync(page, pageSize);
                return Ok(new { success = true, data = jobs, page, pageSize });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failed jobs");
                return StatusCode(500, new { success = false, message = "Error retrieving failed jobs" });
            }
        }

        [HttpGet("jobs/{jobId}/status")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            try
            {
                var status = await _backgroundJobService.GetJobStatusAsync(jobId);
                return Ok(new { success = true, data = new { jobId, status = status.ToString() } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting job status for {JobId}", jobId);
                return StatusCode(500, new { success = false, message = "Error retrieving job status" });
            }
        }

        [HttpPost("enqueue-email")]
        public async Task<IActionResult> EnqueueEmailJob([FromBody] EmailJobRequest request)
        {
            try
            {
                var jobId = await _backgroundJobService.EnqueueEmailJobAsync(request.Email, request.Subject, request.Body);
                return Ok(new { success = true, data = new { jobId, message = "Email job enqueued successfully" } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enqueueing email job");
                return StatusCode(500, new { success = false, message = "Error enqueueing email job" });
            }
        }

        [HttpPost("enqueue-notification")]
        public async Task<IActionResult> EnqueueNotificationJob([FromBody] NotificationJobRequest request)
        {
            try
            {
                var jobId = await _backgroundJobService.EnqueueNotificationJobAsync(request.UserId, request.Title, request.Message);
                return Ok(new { success = true, data = new { jobId, message = "Notification job enqueued successfully" } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enqueueing notification job");
                return StatusCode(500, new { success = false, message = "Error enqueueing notification job" });
            }
        }

        [HttpPost("schedule-reminder")]
        public async Task<IActionResult> ScheduleReminderJob([FromBody] ReminderJobRequest request)
        {
            try
            {
                var jobId = await _backgroundJobService.ScheduleReminderJobAsync(request.UserId, request.Message, request.ReminderTime);
                return Ok(new { success = true, data = new { jobId, message = "Reminder job scheduled successfully" } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling reminder job");
                return StatusCode(500, new { success = false, message = "Error scheduling reminder job" });
            }
        }

        [HttpPost("schedule-data-cleanup")]
        public async Task<IActionResult> ScheduleDataCleanupJob([FromBody] DataCleanupJobRequest request)
        {
            try
            {
                var jobId = await _backgroundJobService.ScheduleDataCleanupJobAsync(request.CleanupTime);
                return Ok(new { success = true, data = new { jobId, message = "Data cleanup job scheduled successfully" } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling data cleanup job");
                return StatusCode(500, new { success = false, message = "Error scheduling data cleanup job" });
            }
        }

        [HttpPost("schedule-report")]
        public async Task<IActionResult> ScheduleReportJob([FromBody] ReportJobRequest request)
        {
            try
            {
                var jobId = await _backgroundJobService.ScheduleReportGenerationJobAsync(request.ReportType, request.GenerationTime);
                return Ok(new { success = true, data = new { jobId, message = "Report generation job scheduled successfully" } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling report job");
                return StatusCode(500, new { success = false, message = "Error scheduling report job" });
            }
        }

        [HttpDelete("jobs/{jobId}")]
        public async Task<IActionResult> DeleteJob(string jobId)
        {
            try
            {
                var result = await _backgroundJobService.DeleteJobAsync(jobId);
                if (result)
                {
                    return Ok(new { success = true, message = "Job deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Job not found or could not be deleted" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting job {JobId}", jobId);
                return StatusCode(500, new { success = false, message = "Error deleting job" });
            }
        }

        [HttpDelete("recurring-jobs/{jobId}")]
        public async Task<IActionResult> DeleteRecurringJob(string jobId)
        {
            try
            {
                var result = await _backgroundJobService.DeleteRecurringJobAsync(jobId);
                if (result)
                {
                    return Ok(new { success = true, message = "Recurring job deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Recurring job not found or could not be deleted" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting recurring job {JobId}", jobId);
                return StatusCode(500, new { success = false, message = "Error deleting recurring job" });
            }
        }
    }

    #region Request Models

    public class EmailJobRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public class NotificationJobRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class ReminderJobRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime ReminderTime { get; set; }
    }

    public class DataCleanupJobRequest
    {
        public DateTime CleanupTime { get; set; }
    }

    public class ReportJobRequest
    {
        public string ReportType { get; set; } = string.Empty;
        public DateTime GenerationTime { get; set; }
    }

    #endregion
}
