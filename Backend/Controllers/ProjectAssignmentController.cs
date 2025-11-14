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
            var dept = User.FindFirst("Department")?.Value;

            try
            {
                var assignments = await _assignmentService.GetAllByProjectAsync(projectId, dept);
                return Ok(assignments);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { 
                    message = ex.Message,
                    errorType = "ValidationError",
                    details = "The request contains invalid data. Please check your input and try again."
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { 
                    message = ex.Message,
                    errorType = "AccessDenied",
                    details = "You don't have permission to access this project.",
                    requesterDepartment = dept,
                    projectId = projectId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error in GetByProject: {ex.Message}");
                return StatusCode(500, new { 
                    message = "An unexpected error occurred while retrieving project members.",
                    errorType = "InternalServerError",
                    details = "Please try again later or contact support if the problem persists."
                });
            }
        }

        /// <summary>
        /// Retrieves all projects assigned to a user.
        /// Enhanced: Accepts both Employee ID (e.g., "EMP12345") or User UUID
        /// </summary>
        /// <param name="employeeId">The Employee ID or User UUID</param>
        /// <returns>A list of projects assigned to the user</returns>
        /// <response code="200">Returns the list of user's projects</response>
        /// <response code="400">If the employee ID or user ID is invalid</response>
        /// <response code="403">If the user is not authorized to access this data</response>
        /// <response code="500">If there was an internal server error</response>
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
                return BadRequest(new { 
                    message = ex.Message,
                    errorType = "ValidationError",
                    details = "The request contains invalid data. Please check your input and try again."
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { 
                    message = ex.Message,
                    errorType = "AccessDenied",
                    details = "You don't have permission to access this user's projects.",
                    requesterDepartment = dept,
                    requestedEmployeeId = employeeId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error in GetProjectsByEmployeeId: {ex.Message}");
                return StatusCode(500, new { 
                    message = "An unexpected error occurred while retrieving user projects.",
                    errorType = "InternalServerError",
                    details = "Please try again later or contact support if the problem persists."
                });
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
                return BadRequest(new { 
                    message = ex.Message,
                    errorType = "ValidationError",
                    details = "The request contains invalid data. Please check your input and try again."
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { 
                    message = ex.Message,
                    errorType = "BusinessRuleViolation",
                    details = "This operation cannot be completed due to business rules."
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { 
                    message = ex.Message,
                    errorType = "AccessDenied",
                    details = "You don't have permission to perform this action.",
                    requesterDepartment = dept
                });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                Console.WriteLine($"Unexpected error in Add-members: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    message = "An unexpected error occurred while adding the member to the project.",
                    errorType = "InternalServerError",
                    details = "Please try again later or contact support if the problem persists."
                });
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

        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPendingAssignments(string userId)
        {
            try
            {
                var assignments = await _assignmentService.GetPendingAssignmentsForUserAsync(userId);
                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving pending assignments: {ex.Message}");
            }
        }


        // DELETE: Delete member from the project
        // GET: Show team member details for projects they're in charge of (ScrumMaster/TeamLeader)
        [HttpGet("team-members-in-charge/{employeeId}")]
        public async Task<IActionResult> GetTeamMembersForProjectsInCharge(string employeeId)
        {
            try
            {
                var user = await _userService.GetUserByEmployeeIdAsync(employeeId);
                if (user == null) return NotFound("Employee not found.");

                // Get projects where the employee is ScrumMaster or TeamLeader
                var projectsInCharge = await _context.ProjectAssignments
                    .Include(pa => pa.Project)
                    .Where(pa => pa.MemberId == user.Id && 
                               (pa.MemberRole == "ScrumMaster" || pa.MemberRole == "TeamLeader"))
                    .Select(pa => pa.ProjectId)
                    .ToListAsync();

                // Get all team members for those projects
                var teamMembersDetails = await _context.ProjectAssignments
                    .Include(pa => pa.Member)
                    .Include(pa => pa.Project)
                    .Where(pa => projectsInCharge.Contains(pa.ProjectId))
                    .Select(pa => new
                    {
                        ProjectId = pa.ProjectId,
                        ProjectName = pa.Project.ProjectName,
                        MemberEmployeeId = pa.Member.EmployeeId,
                        MemberFullName = pa.Member.FullName,
                        MemberRole = pa.MemberRole,
                        Department = pa.Member.Department,
                        Email = pa.Member.Email,
                        Phone = pa.Member.PhoneNumber,
                        AssignmentStatus = pa.Status,
                        JoinedDate = pa.CreatedDate
                    })
                    .ToListAsync();

                var result = teamMembersDetails
                    .GroupBy(t => t.ProjectId)
                    .Select(g => new
                    {
                        ProjectId = g.Key,
                        ProjectName = g.First().ProjectName,
                        TeamMembers = g.Select(member => new
                        {
                            member.MemberEmployeeId,
                            member.MemberFullName,
                            member.MemberRole,
                            member.Department,
                            member.Email,
                            member.Phone,
                            member.AssignmentStatus,
                            member.JoinedDate
                        }).ToList()
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving team member details: {ex.Message}");
            }
        }

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
