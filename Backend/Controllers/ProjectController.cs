using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Entities;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Project
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await _context.Projects.ToListAsync();
            return Ok(projects);
        }

        // POST: api/Project
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Project project)
        {
            if (!ModelState.IsValid)
            return BadRequest(ModelState);

            project.CreatedDate = DateTime.UtcNow;
            project.CreateUser = "System"; // TODO: Replace with actual user logic

            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProjects), new { id = project.Id }, project);
        }
    }
}