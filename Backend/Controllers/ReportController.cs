using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Reports;
using ProjectManagementSystem1.Services.ReportService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly ILogger<ReportController> _logger;

        public ReportController(IReportService reportService, ILogger<ReportController> logger)
        {
            _reportService = reportService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a project summary report
        /// </summary>
        [HttpPost("project-summary")]
        public async Task<ActionResult<ReportResponseDto<ProjectSummaryReportDto>>> GenerateProjectSummaryReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                request.ReportType = ReportType.ProjectSummary;
                var report = await _reportService.GenerateProjectSummaryReportAsync(request, userId);
                
                return Ok(report);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to project summary report");
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating project summary report");
                return StatusCode(500, "An error occurred while generating the report");
            }
        }

        /// <summary>
        /// Generate a task progress report
        /// </summary>
        [HttpPost("task-progress")]
        public async Task<ActionResult<ReportResponseDto<TaskProgressReportDto>>> GenerateTaskProgressReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                request.ReportType = ReportType.TaskProgress;
                var report = await _reportService.GenerateTaskProgressReportAsync(request, userId);
                
                return Ok(report);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to task progress report");
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating task progress report");
                return StatusCode(500, "An error occurred while generating the report");
            }
        }

        /// <summary>
        /// Generate a team performance report (requires Manager or Admin role)
        /// </summary>
        [HttpPost("team-performance")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ReportResponseDto<TeamPerformanceReportDto>>> GenerateTeamPerformanceReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                request.ReportType = ReportType.TeamPerformance;
                var report = await _reportService.GenerateTeamPerformanceReportAsync(request, userId);
                
                return Ok(report);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to team performance report");
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating team performance report");
                return StatusCode(500, "An error occurred while generating the report");
            }
        }

        /// <summary>
        /// Generate an issue summary report
        /// </summary>
        [HttpPost("issue-summary")]
        public async Task<ActionResult<ReportResponseDto<IssueSummaryReportDto>>> GenerateIssueSummaryReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                request.ReportType = ReportType.IssueSummary;
                var report = await _reportService.GenerateIssueSummaryReportAsync(request, userId);
                
                return Ok(report);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to issue summary report");
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating issue summary report");
                return StatusCode(500, "An error occurred while generating the report");
            }
        }

        /// <summary>
        /// Generate any type of report based on request
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<ReportResponseDto<object>>> GenerateReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                // Check if user has permission for team performance reports
                if (request.ReportType == ReportType.TeamPerformance)
                {
                    if (!User.IsInRole("Manager") && !User.IsInRole("Admin"))
                        return Forbid("Team performance reports require Manager or Admin role");
                }

                var report = await _reportService.GenerateReportAsync(request, userId);
                return Ok(report);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to report generation");
                return Unauthorized(ex.Message);
            }
            catch (NotSupportedException ex)
            {
                _logger.LogWarning(ex, "Unsupported report type requested");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report");
                return StatusCode(500, "An error occurred while generating the report");
            }
        }

        /// <summary>
        /// Export a report in the specified format
        /// </summary>
        [HttpPost("export")]
        public async Task<IActionResult> ExportReport([FromBody] ReportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                // Check if user has permission for team performance reports
                if (request.ReportType == ReportType.TeamPerformance)
                {
                    if (!User.IsInRole("Manager") && !User.IsInRole("Admin"))
                        return Forbid("Team performance reports require Manager or Admin role");
                }

                var exportData = await _reportService.ExportReportAsync(request, userId);
                
                var contentType = request.Format switch
                {
                    ReportFormat.Json => "application/json",
                    ReportFormat.Csv => "text/csv",
                    ReportFormat.Excel => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ReportFormat.Pdf => "application/pdf",
                    _ => "application/octet-stream"
                };

                var fileName = $"{request.ReportType}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.{request.Format.ToString().ToLower()}";
                
                return File(exportData, contentType, fileName);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to report export");
                return Unauthorized(ex.Message);
            }
            catch (NotSupportedException ex)
            {
                _logger.LogWarning(ex, "Unsupported report format requested");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting report");
                return StatusCode(500, "An error occurred while exporting the report");
            }
        }

        /// <summary>
        /// Get available report templates for the current user
        /// </summary>
        [HttpGet("templates")]
        public async Task<ActionResult<List<ReportTemplateDto>>> GetAvailableReports()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                var templates = await _reportService.GetAvailableReportsAsync(userId);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available reports");
                return StatusCode(500, "An error occurred while retrieving available reports");
            }
        }

        /// <summary>
        /// Get metadata for a specific report type
        /// </summary>
        [HttpGet("metadata/{reportType}")]
        public async Task<ActionResult<ReportMetadataDto>> GetReportMetadata(ReportType reportType)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                var metadata = await _reportService.GetReportMetadataAsync(reportType, userId);
                return Ok(metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report metadata");
                return StatusCode(500, "An error occurred while retrieving report metadata");
            }
        }

        /// <summary>
        /// Schedule a report for automatic generation (future enhancement)
        /// </summary>
        [HttpPost("schedule")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<bool>> ScheduleReport([FromBody] ScheduledReportDto scheduledReport)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                var result = await _reportService.ScheduleReportAsync(scheduledReport, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling report");
                return StatusCode(500, "An error occurred while scheduling the report");
            }
        }

        /// <summary>
        /// Get scheduled reports for the current user
        /// </summary>
        [HttpGet("scheduled")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<ScheduledReportDto>>> GetScheduledReports()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                var scheduledReports = await _reportService.GetScheduledReportsAsync(userId);
                return Ok(scheduledReports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting scheduled reports");
                return StatusCode(500, "An error occurred while retrieving scheduled reports");
            }
        }

        /// <summary>
        /// Get a quick dashboard summary of key metrics
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetDashboardSummary()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found in token");

                // Generate quick reports for dashboard
                var projectRequest = new ReportRequestDto { ReportType = ReportType.ProjectSummary };
                var taskRequest = new ReportRequestDto { ReportType = ReportType.TaskProgress };
                var issueRequest = new ReportRequestDto { ReportType = ReportType.IssueSummary };

                var projectReport = await _reportService.GenerateProjectSummaryReportAsync(projectRequest, userId);
                var taskReport = await _reportService.GenerateTaskProgressReportAsync(taskRequest, userId);
                var issueReport = await _reportService.GenerateIssueSummaryReportAsync(issueRequest, userId);

                var dashboard = new
                {
                    GeneratedAt = DateTime.UtcNow,
                    Projects = new
                    {
                        Total = projectReport.Data.Overview.TotalProjects,
                        Active = projectReport.Data.Overview.ActiveProjects,
                        Completed = projectReport.Data.Overview.CompletedProjects,
                        Overdue = projectReport.Data.Overview.OverdueProjects,
                        AverageProgress = Math.Round(projectReport.Data.Overview.AverageProgress, 1)
                    },
                    Tasks = new
                    {
                        Total = taskReport.Data.Overview.TotalTasks,
                        Completed = taskReport.Data.Overview.CompletedTasks,
                        InProgress = taskReport.Data.Overview.InProgressTasks,
                        Overdue = taskReport.Data.Overview.OverdueTasks,
                        CompletionRate = Math.Round(taskReport.Data.Overview.CompletionRate, 1)
                    },
                    Issues = new
                    {
                        Total = issueReport.Data.Overview.TotalIssues,
                        Open = issueReport.Data.Overview.OpenIssues,
                        Resolved = issueReport.Data.Overview.ResolvedIssues,
                        ResolutionRate = Math.Round(issueReport.Data.Overview.ResolutionRate, 1)
                    }
                };

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating dashboard summary");
                return StatusCode(500, "An error occurred while generating the dashboard summary");
            }
        }
    }
}
