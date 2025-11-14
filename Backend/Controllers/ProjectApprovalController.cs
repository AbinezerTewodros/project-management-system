using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.ProjectDto;
using ProjectManagementSystem1.Services.ProjectService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectApprovalController : ControllerBase
    {
        private readonly IProjectApprovalService _projectApprovalService;
        private readonly ILogger<ProjectApprovalController> _logger;

        public ProjectApprovalController(
            IProjectApprovalService projectApprovalService,
            ILogger<ProjectApprovalController> logger)
        {
            _projectApprovalService = projectApprovalService;
            _logger = logger;
        }

        [HttpPost("approve")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> ApproveProject([FromBody] ProjectApprovalRequestDto request)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                request.ApproverUserId = currentUserId;
                var result = await _projectApprovalService.ApproveProjectAsync(request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving project");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("reject")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> RejectProject([FromBody] ProjectApprovalRequestDto request)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                request.ApproverUserId = currentUserId;
                var result = await _projectApprovalService.RejectProjectAsync(request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting project");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("pending")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var pendingApprovals = await _projectApprovalService.GetPendingApprovalsAsync(currentUserId);
                return Ok(pendingApprovals);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending approvals");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("status/{projectId}")]
        public async Task<IActionResult> GetProjectApprovalStatus(int projectId)
        {
            try
            {
                var status = await _projectApprovalService.GetProjectApprovalStatusAsync(projectId);
                return Ok(status);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project approval status");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("history")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> GetApprovalHistory()
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var history = await _projectApprovalService.GetApprovalHistoryAsync(currentUserId);
                return Ok(history);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting approval history");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("can-create")]
        public async Task<IActionResult> CanUserCreateProject()
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var canCreate = await _projectApprovalService.CanUserCreateProjectAsync(currentUserId);
                var isManager = await _projectApprovalService.IsUserManagerOrAboveAsync(currentUserId);

                return Ok(new
                {
                    CanCreate = canCreate,
                    IsManagerOrAbove = isManager,
                    RequiresApproval = !isManager
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user permissions");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
