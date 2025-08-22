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
    public class EnhancedAssignmentController : ControllerBase
    {
        private readonly IEnhancedAssignmentService _enhancedAssignmentService;
        private readonly ILogger<EnhancedAssignmentController> _logger;

        public EnhancedAssignmentController(
            IEnhancedAssignmentService enhancedAssignmentService,
            ILogger<EnhancedAssignmentController> logger)
        {
            _enhancedAssignmentService = enhancedAssignmentService;
            _logger = logger;
        }

        // Enhanced Assignment Management
        [HttpPost]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateEnhancedAssignmentDto dto)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.CreateAssignmentAsync(dto, currentUserId);
                return Ok(result);
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
                _logger.LogError(ex, "Error creating assignment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{assignmentId}")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> UpdateAssignment(int assignmentId, [FromBody] UpdateAssignmentDto dto)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.UpdateAssignmentAsync(assignmentId, dto, currentUserId);
                return Ok(result);
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
                _logger.LogError(ex, "Error updating assignment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{assignmentId}")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> DeleteAssignment(int assignmentId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.DeleteAssignmentAsync(assignmentId, currentUserId);
                if (result)
                    return Ok("Assignment deleted successfully");
                else
                    return NotFound("Assignment not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assignment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignment(int assignmentId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetAssignmentAsync(assignmentId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectAssignments(int projectId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetProjectAssignmentsAsync(projectId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project assignments");
                return StatusCode(500, "Internal server error");
            }
        }

        // Multiple Scrum Master Support
        [HttpGet("project/{projectId}/scrum-masters")]
        public async Task<IActionResult> GetProjectScrumMasters(int projectId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetProjectScrumMastersAsync(projectId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project scrum masters");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("project/{projectId}/multiple-scrum-masters")]
        public async Task<IActionResult> GetMultipleScrumMasters(int projectId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetMultipleScrumMastersAsync(projectId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting multiple scrum masters");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("project/{projectId}/set-primary-scrum-master")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> SetPrimaryScrumMaster(int projectId, [FromBody] string memberId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.SetPrimaryScrumMasterAsync(projectId, memberId, currentUserId);
                if (result)
                    return Ok("Primary scrum master set successfully");
                else
                    return BadRequest("Failed to set primary scrum master");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary scrum master");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("project/{projectId}/add-scrum-master")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> AddScrumMaster(int projectId, [FromBody] AddScrumMasterRequest request)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.AddScrumMasterAsync(projectId, request.MemberId, request.IsPrimary, currentUserId);
                if (result)
                    return Ok("Scrum master added successfully");
                else
                    return BadRequest("Failed to add scrum master");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding scrum master");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("project/{projectId}/remove-scrum-master/{memberId}")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> RemoveScrumMaster(int projectId, string memberId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.RemoveScrumMasterAsync(projectId, memberId, currentUserId);
                if (result)
                    return Ok("Scrum master removed successfully");
                else
                    return BadRequest("Failed to remove scrum master");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing scrum master");
                return StatusCode(500, "Internal server error");
            }
        }

        // Availability Tracking
        [HttpGet("availability/{memberId}")]
        public async Task<IActionResult> GetMemberAvailability(string memberId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetMemberAvailabilityAsync(memberId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting member availability");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("availability")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> GetAllMembersAvailability()
        {
            try
            {
                var result = await _enhancedAssignmentService.GetAllMembersAvailabilityAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all members availability");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("project/{projectId}/available-members")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> GetAvailableMembersForProject(int projectId, [FromQuery] double requiredWorkload = 100.0)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetAvailableMembersForProjectAsync(projectId, requiredWorkload);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available members for project");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("availability/check/{memberId}")]
        public async Task<IActionResult> CheckMemberAvailability(string memberId, [FromQuery] double requiredWorkload)
        {
            try
            {
                var result = await _enhancedAssignmentService.CheckMemberAvailabilityAsync(memberId, requiredWorkload);
                return Ok(new { IsAvailable = result });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking member availability");
                return StatusCode(500, "Internal server error");
            }
        }

        // Reassignment
        [HttpPost("reassign")]
        [Authorize(Policy = "AdminOrManager")]
        public async Task<IActionResult> ReassignMember([FromBody] ReassignmentRequestDto request)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized("User not authenticated");

                var result = await _enhancedAssignmentService.ReassignMemberAsync(request, currentUserId);
                return Ok(result);
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
                _logger.LogError(ex, "Error reassigning member");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("reassignment-history/{memberId}")]
        public async Task<IActionResult> GetReassignmentHistory(string memberId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetReassignmentHistoryAsync(memberId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reassignment history");
                return StatusCode(500, "Internal server error");
            }
        }

        // Workload Management
        [HttpGet("workload/{memberId}")]
        public async Task<IActionResult> GetMemberTotalWorkload(string memberId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetMemberTotalWorkloadAsync(memberId);
                return Ok(new { TotalWorkload = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting member total workload");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("workload/{memberId}/projects")]
        public async Task<IActionResult> GetMemberProjectWorkloads(string memberId)
        {
            try
            {
                var result = await _enhancedAssignmentService.GetMemberProjectWorkloadsAsync(memberId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting member project workloads");
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class AddScrumMasterRequest
    {
        public string MemberId { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
    }
}
