using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Services.UserService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectAssignmentController : ControllerBase
    {
        private readonly IProjectAssignmentService _assignmentService;
        private readonly IUserService _userService;
        private readonly AppDbContext _context;

        public ProjectAssignmentController(IProjectAssignmentService assignmentService, IUserService userService, AppDbContext context)
        {
            _assignmentService = assignmentService;
            _userService = userService;
            _context = context;
        }

        // GET: Show all members of a project
        [HttpGet("All-members")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check if user is part of the project
            bool isMember = await _context.ProjectAssignments
                .AnyAsync(pa => pa.ProjectId == projectId && pa.MemberId == userId);

            if (!isMember)
                return Forbid("You are not a member of this project.");

            var assignments = await _assignmentService.GetAllByProjectAsync(projectId);
            return Ok(assignments);
            //var dept = User.FindFirst("Department")?.Value;

            //try
            //{
            //    var assignments = await _assignmentService.GetAllByProjectAsync(projectId, dept);
            //    return Ok(assignments);
            //}
            //catch (UnauthorizedAccessException ex)
            //{
            //    return Forbid(ex.Message);
            //}
        }

        // GET: Show all projects assigned for a user
        [HttpGet("User-projects")]
        [Authorize] // Optional: Adjust roles as needed
        public async Task<IActionResult> GetProjectsByEmployeeId(string employeeId)
        {
            var dept = User.FindFirst("Department")?.Value;

            try
            {
                var result = await _assignmentService.GetProjectsByEmployeeIdAsync(employeeId, dept);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }


        // POST: Add members to the project
        [HttpPost("Add-members")]
        public async Task<IActionResult> Create([FromBody] CreateAssignmentDto dto)
        {
            //var dept = User.FindFirst("Department")?.Value;
            var currentUser = User.FindFirstValue(ClaimTypes.Name);
            try
            {
                var result = await _assignmentService.CreateAsync(dto, currentUser);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // PUT: Edit role of the project members
        [HttpPut("edit-role")]
        //[Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> EditRole([FromBody] UpdateAssignmentDto dto)
        {
            var user = await _userService.GetUserByEmployeeIdAsync(dto.EmployeeId);
            if (user == null) return NotFound("User not found.");

            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId && p.MemberId == user.Id);

            if (assignment == null) return NotFound("Assignment not found.");

            assignment.MemberRole = dto.MemberRole;
            assignment.Role = dto.MemberRole;
            assignment.UpdatedDate = DateTime.UtcNow;
            assignment.UpdateUser = User.FindFirstValue(ClaimTypes.NameIdentifier);

            await _context.SaveChangesAsync();
            return Ok("✅ Role updated.");
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveAssignment(int id)
        {
            var leaderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _assignmentService.ApproveProjectAssignmentAsync(id, leaderId);
            return NoContent();
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectAssignment(int id, [FromBody] string reason)
        {
            var leaderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _assignmentService.RejectProjectAssignmentAsync(id, leaderId, reason);
            return NoContent();
        }


        // DELETE: Delete member from the project
        [HttpDelete("delete-member")]
        //[Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> DeleteMember([FromBody] UpdateAssignmentDto dto)
        {
            var user = await _userService.GetUserByEmployeeIdAsync(dto.EmployeeId);
            if (user == null) return NotFound("User not found.");

            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId && p.MemberId == user.Id);

            if (assignment == null) return NotFound("Assignment not found.");

            _context.ProjectAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return Ok("🗑️ Member removed from project.");
        }
    }
}
