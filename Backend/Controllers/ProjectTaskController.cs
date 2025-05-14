using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Entities;
using ProjectManagementSystem1.Model.Dtos;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectTaskController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectTaskController(AppDbContext context)
        {
            _context = context;
        }

        // Accessible by all authenticated users
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllTasks()
        {
            var tasks = await _context.ProjectTasks.ToListAsync();
            return Ok(tasks);
        }

        // Only Supervisors can create tasks
        [HttpPost]
        [Authorize(Policy = "SupervisorOnly")]
        public async Task<IActionResult> CreateTask([FromBody] ProjectTask task)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            task.CreatedDate = DateTime.UtcNow;
            await _context.ProjectTasks.AddAsync(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        // All authenticated users can view tasks
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
                return NotFound();

            return Ok(task);
        }

        // Only Supervisors can update tasks
        [HttpPut("{id}")]
        [Authorize(Policy = "SupervisorOnly")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] ProjectTask task)
        {
            if (id != task.Id)
                return BadRequest("Task ID mismatch");

            var existingTask = await _context.ProjectTasks.FindAsync(id);
            if (existingTask == null)
                return NotFound();

            existingTask.Title = task.Title;
            existingTask.Descriptions = task.Descriptions;
            existingTask.Status = task.Status;
            existingTask.DueDate = task.DueDate;
            existingTask.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Only Supervisors can delete tasks
        [HttpDelete("{id}")]
        [Authorize(Policy = "SupervisorOnly")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
                return NotFound();

            _context.ProjectTasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}