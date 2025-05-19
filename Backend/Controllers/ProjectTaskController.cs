using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectTaskController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IProjectTaskService _projectTaskService;

        public ProjectTaskController(AppDbContext context, IProjectTaskService projectTaskService)
        {
            _context = context;
            _projectTaskService = projectTaskService;
        }
        // Accessible by all authenticated users
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllTasks()
        {
            var tasks = await _context.ProjectTasks.ToListAsync();
            return Ok(tasks);
        }

        // Accessible by all authenticated users
        // Retrieves a task by its ID
        [HttpGet("{Id}")]
        [Authorize]
        public async Task<IActionResult> GetTaskById(int Id)
        {
            var task = await _context.ProjectTasks.FindAsync(Id);
            if (task == null)
                return NotFound();

            return Ok(task);
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

            return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
        }

        // Only Supervisors can update tasks
        [HttpPut("{id}")]
        [Authorize(Policy = "SupervisorOnly")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateProjectTaskDto dto)
        {
            if (id != dto.Id)
                return BadRequest("Task ID mismatch.");

            try
            {
                var existingTask = await _projectTaskService.GetByIdAsync(id);
                if (existingTask == null)
                    return NotFound("Task not found.");
                var updateResult = await _projectTaskService.UpdateAsync(id, dto);
                if (!updateResult)
                    return Conflict("The task was modified by someone else.");
                    return Ok("Task updated successfully.");
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("Concurrency conflict detected.");
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
