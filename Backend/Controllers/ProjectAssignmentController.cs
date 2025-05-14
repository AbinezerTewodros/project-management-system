using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Entities;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectAssignmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectAssignmentController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ProjectAssignment
        [HttpGet]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> GetAssignments()
        {
            var assignments = await _context.ProjectAssignments
                                            .Include(pa => pa.Member)
                                            .Include(pa => pa.Project)
                                            .ToListAsync();
            return Ok(assignments);
        }

        // POST: api/ProjectAssignment
        [HttpPost]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> AssignUserToProject([FromBody] ProjectAssignment assignment)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            assignment.AssignedDate = DateTime.UtcNow;

            await _context.ProjectAssignments.AddAsync(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignments), new { id = assignment.Id }, assignment);
        }

        // DELETE: api/ProjectAssignment/{id}
        [HttpDelete("{id}")]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> RemoveAssignment(int id)
        {
            var assignment = await _context.ProjectAssignments.FindAsync(id);
            if (assignment == null)
                return NotFound();

            _context.ProjectAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}