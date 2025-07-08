using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Services.ProjectService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // only authenticated users access the endpoints
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly AppDbContext _context;

        public ProjectController(IProjectService projectService, AppDbContext context)
        {
            _projectService = projectService;
            _context = context;
        }

        [HttpGet("All-projects")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetAll()
        {
            var userDept = User.FindFirst("Department")?.Value;
            if (userDept == null) return Forbid();

            var projects = await _projectService.GetAllAsync(userDept);
            return Ok(projects);
        }

        [HttpGet("project-byId")]
        public async Task<IActionResult> GetById(int id)
        {
            var project = await _projectService.GetByIdAsync(id);
            if (project == null)
                return NotFound();
            return Ok(project);
        }

        //Get All Projects by Priority
        [HttpGet("project-by-priority/{priority}")]
        public async Task<IActionResult> GetProjectsByPriority(string priority)
        {
            var projects = await _context.Projects
                .Where(p => p.Priority.ToLower() == priority.ToLower())
                .ToListAsync();

            return Ok(projects);
        }

        [HttpPost("create-project")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Unauthorized()
;
            var created = await _projectService.CreateAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("edit-project")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectDto dto)
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            var updated = await _projectService.UpdateAsync(id, dto, username);
            if (updated == null)
                return NotFound();
            return Ok(updated);
        }

        [HttpDelete("delete-project")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _projectService.DeleteAsync(id);
            if (!deleted)
                return NotFound();
            return NoContent();
        }

    }
}
