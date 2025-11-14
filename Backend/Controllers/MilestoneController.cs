using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.NotificationService;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MilestoneController : ControllerBase
    {
        private readonly IMilestoneService _milestoneService;
        private readonly INotificationService _notificationService;

        public MilestoneController(IMilestoneService milestoneService, INotificationService notificationService)
        {
            _milestoneService = milestoneService;
            _notificationService = notificationService;
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(MilestoneReadDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<MilestoneReadDto>> GetMilestoneById(int id)
        {
            var milestone = await _milestoneService.GetMilestoneByIdAsync(id);
            return milestone == null ? NotFound() : Ok(milestone);
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MilestoneReadDto>), 200)]
        public async Task<ActionResult<IEnumerable<MilestoneReadDto>>> GetAllMilestones()
        {
            var milestones = await _milestoneService.GetAllMilestoneAsync();
            return Ok(milestones);
        }

        [HttpGet("{milestoneId}/progress")]
        public async Task<ActionResult<double>> GetMilestoneProgress(int milestoneId)
        {
            try
            {
                var progress = await _milestoneService.CalculateMilestoneProgress(milestoneId);
                return Ok(new { Progress = progress });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error calculating progress: {ex.Message}");
            }
        }
        [HttpGet("project/{projectId}")]
        [ProducesResponseType(typeof(IEnumerable<MilestoneReadDto>), 200)]
        public async Task<ActionResult<IEnumerable<MilestoneReadDto>>> GetMilestonesByProjectId(int projectId)
        {
            var milestones = await _milestoneService.GetMilestonesByProjectIdAsync(projectId);
            return Ok(milestones);
        }

        [HttpPost("create-milestone")]
        public async Task<IActionResult> Create([FromBody] CreateMilestoneDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var milestone = await _milestoneService.CreateAsync(dto);
            
            // Send notification for milestone creation
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userId))
                {
                    await _notificationService.SendNotificationAsync(
                        userId,
                        "Milestone Created",
                        $"New milestone '{dto.MilestoneName}' has been created successfully.",
                        "MilestoneCreated",
                        "Milestone",
                        milestone.MilestoneId
                    );
                }
            }
            catch (Exception ex)
            {
                // Log but don't break the milestone creation
                Console.WriteLine($"Failed to send milestone creation notification: {ex.Message}");
            }
            
            return CreatedAtAction(nameof(GetMilestoneById), new { id = milestone.MilestoneId }, milestone);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMilestone(int id, [FromBody] UpdateMilestoneDto dto) // Changed parameter type
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (id != dto.MilestoneId)
            {
                ModelState.AddModelError("MilestoneId", "URL ID doesn't match body ID");
            }

            var updatedMilestone = await _milestoneService.UpdateMilestoneAsync(id, dto);
            if (updatedMilestone == null)
            {
                return NotFound();
            }
            
            // Send notification for milestone update
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userId))
                {
                    await _notificationService.SendNotificationAsync(
                        userId,
                        "Milestone Updated",
                        $"Milestone '{dto.MilestoneName ?? "Milestone"}' has been updated successfully.",
                        "MilestoneUpdated",
                        "Milestone",
                        id
                    );
                }
            }
            catch (Exception ex)
            {
                // Log but don't break the milestone update
                Console.WriteLine($"Failed to send milestone update notification: {ex.Message}");
            }
            
            return Ok(updatedMilestone);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMilestone(int id)
        {
            var result = await _milestoneService.DeleteMilestoneAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        // Assignment Approval Endpoints
        [HttpPut("{id}/accept-assignment")]
        public async Task<IActionResult> AcceptMilestoneAssignment(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                await _milestoneService.AcceptMilestoneAssignmentAsync(id, userId);
                
                // Send notification for milestone assignment acceptance
                try
                {
                    await _notificationService.SendNotificationAsync(
                        userId,
                        "Milestone Assignment Accepted",
                        "You have accepted the milestone assignment.",
                        "MilestoneAccepted",
                        "Milestone",
                        id
                    );
                }
                catch (Exception ex)
                {
                    // Log but don't break the milestone acceptance
                    Console.WriteLine($"Failed to send milestone acceptance notification: {ex.Message}");
                }
                
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{id}/reject-assignment")]
        public async Task<IActionResult> RejectMilestoneAssignment(int id, [FromBody] string reason)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                await _milestoneService.RejectMilestoneAssignmentAsync(id, userId, reason);
                
                // Send notification for milestone assignment rejection
                try
                {
                    await _notificationService.SendNotificationAsync(
                        userId,
                        "Milestone Assignment Rejected",
                        $"You have rejected the milestone assignment. Reason: {reason ?? "No reason provided"}",
                        "MilestoneRejected",
                        "Milestone",
                        id
                    );
                }
                catch (Exception ex)
                {
                    // Log but don't break the milestone rejection
                    Console.WriteLine($"Failed to send milestone rejection notification: {ex.Message}");
                }
                
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("pending/{userId}")]
        public async Task<ActionResult<List<MilestoneReadDto>>> GetPendingMilestones(string userId)
        {
            try
            {
                var milestones = await _milestoneService.GetPendingMilestonesForUserAsync(userId);
                return Ok(milestones);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving pending milestones: {ex.Message}");
            }
        }

        [HttpGet("assigned-to/{userId}")]
        public async Task<ActionResult<List<MilestoneReadDto>>> GetMilestonesAssignedToUser(string userId)
        {
            try
            {
                var milestones = await _milestoneService.GetMilestonesAssignedToUserAsync(userId);
                return Ok(milestones);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving assigned milestones: {ex.Message}");
            }
        }


        // Additons

        /// <summary>
        /// Add a team member to a milestone
        /// </summary>
        [HttpPost("{milestoneId}/team/{memberId}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AddTeamMember(int milestoneId, string memberId)
        {
            try
            {
                await _milestoneService.AddTeamMemberAsync(milestoneId, memberId);
                return Ok(new { message = "Team member added successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Remove a team member from a milestone
        /// </summary>
        [HttpDelete("{milestoneId}/team/{memberId}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RemoveTeamMember(int milestoneId, string memberId)
        {
            try
            {
                await _milestoneService.RemoveTeamMemberAsync(milestoneId, memberId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpPut("{milestoneId}/primary/{memberId}")]
        public async Task<IActionResult> SetPrmiaryAssignee(int milestoneId, string memberId)
        {
            await _milestoneService.SetPrimaryAssigneeAsync(milestoneId, memberId);
            return Ok(new { message = "Primary assignee set successfully" });
        }

        /// <summary>
        /// Get all team members for a milestone (including primary assigned member)
        /// </summary>
        [HttpGet("{milestoneId}/team")]
        [ProducesResponseType(typeof(List<string>), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<List<string>>> GetMilestoneTeam(int milestoneId)
        {
            try
            {
                var teamMembers = await _milestoneService.GetTeamMembersAsync(milestoneId);
                return Ok(teamMembers);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        // In your MilestoneController
        [HttpPost("{milestoneId}/team/{memberId}/with-role")]
        public async Task<IActionResult> AddTeamMemberWithRole(int milestoneId, string memberId,
            [FromQuery] string role = "Contributor", [FromQuery] bool isLead = false)
        {
            await _milestoneService.AddTeamMemberWithRoleAsync(milestoneId, memberId, role, isLead);
            return Ok(new { message = "Team member added with role successfully" });
        }

        [HttpPut("{milestoneId}/team/{memberId}/role")]
        public async Task<IActionResult> UpdateMemberRole(int milestoneId, string memberId,
            [FromQuery] string role = "Contributor", [FromQuery] bool isLead = false)
        {
            await _milestoneService.UpdateMemberRoleAsync(milestoneId, memberId, role, isLead);
            return Ok(new { message = "Member role updated successfully" });
        }

        [HttpGet("{milestoneId}/team-with-roles")]
        public async Task<ActionResult<List<MilestoneMember>>> GetMilestoneMembersWithRoles(int milestoneId)
        {
            var members = await _milestoneService.GetMilestoneMembersWithRolesAsync(milestoneId);
            return Ok(members);
        }
        /// <summary>
        /// Bulk add team members to a milestone
        /// </summary>
        [HttpPost("{milestoneId}/team/bulk")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AddTeamMembersBulk(int milestoneId, [FromBody] List<string> memberIds)
        {
            try
            {
                foreach (var memberId in memberIds)
                {
                    await _milestoneService.AddTeamMemberAsync(milestoneId, memberId);
                }
                return Ok(new { message = $"{memberIds.Count} team members added successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }

        }

       
    }
    }
