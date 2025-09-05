using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.TaskDependencyDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.TaskDependencyService;
using ProjectManagementSystem1.Services;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TaskDependencyController : ControllerBase
    {
        private readonly ITaskDependencyService _taskDependencyService;
        private readonly IActivityLogService _activityLogService;

        public TaskDependencyController(ITaskDependencyService taskDependencyService, IActivityLogService activityLogService)
        {
            _taskDependencyService = taskDependencyService;
            _activityLogService = activityLogService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateDependency([FromBody] CreateTaskDependencyDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userEmail = User.FindFirstValue(ClaimTypes.Email);

                var dependency = await _taskDependencyService.CreateDependencyAsync(
                    dto.PredecessorTaskId,
                    dto.SuccessorTaskId,
                    dto.DependencyType,
                    dto.LagDays,
                    dto.Description,
                    userId
                );

                // Log the creation activity
                await _activityLogService.LogActivityAsync(
                    userId: userId,
                    entityType: "TaskDependency",
                    entityId: dependency.Id,
                    actionType: "Created",
                    details: $"Task dependency created: Task {dto.PredecessorTaskId} -> Task {dto.SuccessorTaskId} ({dto.DependencyType})"
                );

                return CreatedAtAction(nameof(GetDependency), new { id = dependency.Id }, dependency);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the dependency." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDependencies()
        {
            try
            {
                // Note: This method doesn't exist in the interface, so we'll return a message
                return Ok(new { message = "Use GET /api/taskdependencies/task/{taskId} to get dependencies for a specific task" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving dependencies." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDependency(int id)
        {
            try
            {
                // Note: This method doesn't exist in the interface, so we'll return a message
                return Ok(new { message = "Use GET /api/taskdependencies/task/{taskId} to get dependencies for a specific task" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the dependency." });
            }
        }

        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetDependenciesForTask(int taskId)
        {
            try
            {
                var dependencies = await _taskDependencyService.GetDependenciesForTaskAsync(taskId);
                return Ok(dependencies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving task dependencies." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDependency(int id, [FromBody] UpdateTaskDependencyDto dto)
        {
            try
            {
                // Note: UpdateDependencyAsync method doesn't exist in the interface
                return BadRequest(new { message = "Update functionality not implemented in TaskDependencyService" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the dependency." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDependency(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var success = await _taskDependencyService.RemoveDependencyAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Dependency not found." });
                }

                // Log the deletion activity
                await _activityLogService.LogActivityAsync(
                    userId: userId,
                    entityType: "TaskDependency",
                    entityId: id,
                    actionType: "Deleted",
                    details: $"Task dependency deleted"
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the dependency." });
            }
        }

        [HttpGet("validate/{predecessorTaskId}/{successorTaskId}")]
        public async Task<IActionResult> ValidateDependency(int predecessorTaskId, int successorTaskId)
        {
            try
            {
                var hasCircularDependency = await _taskDependencyService.HasCircularDependencyAsync(predecessorTaskId, successorTaskId);
                return Ok(new { 
                    hasCircularDependency,
                    message = hasCircularDependency ? "Circular dependency detected" : "Dependency is valid"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while validating the dependency." });
            }
        }
    }
}
