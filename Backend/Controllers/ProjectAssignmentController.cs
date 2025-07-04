using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Services;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Manager")]
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
            var dept = User.FindFirst("Department")?.Value;

            try
            {
                var assignments = await _assignmentService.GetAllByProjectAsync(projectId, dept);
                return Ok(assignments);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
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
            var dept = User.FindFirst("Department")?.Value;
            var currentUser = User.FindFirstValue(ClaimTypes.Name);
            try
            {
                var result = await _assignmentService.CreateAsync(dto, dept, currentUser);
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
        [Authorize(Policy = "ManagerOnly")]
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


        // DELETE: Delete member from the project
        [HttpDelete("delete-member")]
        [Authorize(Policy = "ManagerOnly")]
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
