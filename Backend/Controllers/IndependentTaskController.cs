using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IndependentTaskController : ControllerBase
    {
        private readonly IIndependentTaskService _independentTaskService;

        public IndependentTaskController(IIndependentTaskService independentTaskService)
        {
            _independentTaskService = independentTaskService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IndependentTask>> GetIndependentTaskById(int id)
        {
            var task = await _independentTaskService.GetIndependentTaskByIdAsync(id);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(task);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IndependentTask>>> GetAllIndependentTasks()
        {
            var tasks = await _independentTaskService.GetAllIndependentTasksAsync();
            return Ok(tasks);
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<IndependentTask>>> GetIndependentTasksByUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            var tasks = await _independentTaskService.GetIndependentTasksByUserAsync(userId);
            return Ok(tasks);
        }

        [HttpPost]
        public async Task<ActionResult<IndependentTask>> CreateIndependentTask([FromBody] IndependentTask task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            task.CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var createdTask = await _independentTaskService.CreateIndependentTaskAsync(task);
            return CreatedAtAction(nameof(GetIndependentTaskById), new { id = createdTask.TaskId }, createdTask);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIndependentTask(int id, [FromBody] IndependentTask task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (id != task.TaskId)
            {
                return BadRequest("The ID in the URL does not match the ID in the request body.");
            }
            var updatedTask = await _independentTaskService.UpdateIndependentTaskAsync(id, task);
            if (updatedTask == null)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIndependentTask(int id)
        {
            var result = await _independentTaskService.DeleteIndependentTaskAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}