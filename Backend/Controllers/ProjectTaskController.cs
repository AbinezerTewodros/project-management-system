using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenQA.Selenium;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.ProjectTaskDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using System.Security.Claims;
using System.Threading.Tasks;


namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication
    public class ProjectTaskController : ControllerBase
    {
        private readonly IProjectTaskService _projectTaskService;
        private readonly ICommentService _commentService;
        private readonly INotificationService _notification;
        private readonly ILogger<ProjectTaskController> _logger;
        public ProjectTaskController(IProjectTaskService projectTaskService, ICommentService commentService, INotificationService notificationService, ILogger<ProjectTaskController> logger)
        {
            _projectTaskService = projectTaskService;
            _commentService = commentService;
            _notification = notificationService;
            _logger = logger;
        }

        //[Authorize(Policy = "SupervisorOnly")]
        [HttpPost("create-task")]
        public async Task<IActionResult> CreateTask([FromBody] ProjectTaskCreateDto dto)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                var task = await _projectTaskService.CreateTaskAsync(dto, memberId);
                try
                {
                    await _notification.CreateNotificationAsync(
                        recipientUserId: User.FindFirstValue(ClaimTypes.NameIdentifier), // Send to the user creating the task
                        subject: "Test Email Notification",
                        message: $"This is a test email notification from your Project Management System to verify email sending functionality.",
                        relatedEntityType: "ProjectTask",
                        relatedEntityId: task.Id,
                        deliveryMethod: NotificationDeliveryMethod.Email
                    );
                }
                catch (Exception ex)
                {
                    // Log the error but don't break the task creation
                    _logger.LogError($"Error sending test email: {ex.Message}");
                }
                return Ok(MapToResponseDto(task));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/ProjectTask/{parentTaskId}/add-subtask
        //[Authorize(Policy = "SupervisorOnly")] // Example: Specific policy for creation
        [HttpPost("{parentTaskId}/add-subtask")]
        public async Task<IActionResult> AddSubtask(int parentTaskId, [FromBody] ProjectTaskCreateDto dto)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                var subtask = await _projectTaskService.AddSubtaskAsync(parentTaskId, dto, memberId);
                return Ok(MapToResponseDto(subtask)); // Or CreatedAtAction
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            // catch (Exception ex) { /* Log error */ return StatusCode(500, "An unexpected error occurred."); }
        }

        private ProjectTaskReadDto MapToResponseDto(ProjectTask task)
        {
            if (task == null) return null;

            return new ProjectTaskReadDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                ProjectAssignmentId = task.ProjectAssignmentId,
                AssignedMemberId = task.AssignedMemberId,
                ParentTaskId = task.ParentTaskId,
                Depth = task.Depth,
                IsLeaf = task.IsLeaf,
                Progress = task.Progress,
                Weight = task.Weight,
                //Priority = task.Priority,
                //Status = task.Status,
                EstimatedHours = task.EstimatedHours,
                ActualHours = task.ActualHours,
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                SubTasks = task.SubTasks.Select(MapToResponseDto).ToList(),
                TodoItems = task.TodoItems.Select(MapTodoItemToReadDto).ToList()
            };
        }

        private TodoItemReadDto MapTodoItemToReadDto(TodoItem todoItem)
        {
            if (todoItem == null) return null;
            return new TodoItemReadDto
            {
                Id = todoItem.Id,
                ProjectTaskId = todoItem.ProjectTaskId,
                Title = todoItem.Title,
                Description = todoItem.Description,
                Weight = todoItem.Weight,
                Progress = todoItem.Progress,
                CreatedAt = todoItem.CreatedAt,
                UpdatedAt = todoItem.UpdatedAt
            };
        }



        [HttpPut("{taskId}/assign/{memberId}")]
        public async Task<IActionResult> AssignTask(int taskId, string memberId)
        {
            var assignerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            try
            {
                await _projectTaskService.AssignTaskAsync(taskId, memberId, assignerId);
                return Ok(); // Or a more descriptive response
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (NotFoundException) // Assuming you might have a custom NotFoundException
            {
                return NotFound();
            }
        }

        // GET: api/ProjectTask/{id}
        [HttpGet("Get-task-by-id/{id}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var task = await _projectTaskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(MapToResponseDto(task));
        }

        // GET: api/ProjectTask
        [HttpGet("Get-all-tasks")]
        public async Task<IActionResult> GetAllTasks()
        {
            var tasks = await _projectTaskService.GetAllTasksAsync();
            return Ok(tasks.Select(MapToResponseDto));
        }

        [HttpPut("update-task/{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] ProjectTaskUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
                return Unauthorized();

            bool isSupervisor = User.IsInRole("Supervisor");

            var updatedTask = await _projectTaskService.UpdateTaskAsync(id, memberId, dto, isSupervisor);
            if (updatedTask == null)
            {
                return NotFound();
            }

            return Ok(MapToResponseDto(updatedTask));
        }

        //[HttpPut("{taskId}/accept")]
        //public async Task<IActionResult> AcceptTask(int taskId)
        //{
        //    var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    if (string.IsNullOrEmpty(memberId))
        //    {
        //        return Unauthorized();
        //    }

        //    try
        //    {
        //        await _projectTaskService.AcceptTaskAsync(taskId, memberId);
        //        return Ok();
        //    }
        //    catch (NotFoundException)
        //    {
        //        return NotFound();
        //    }
        //    catch (InvalidOperationException ex)
        //    {
        //        return BadRequest(ex.Message);
        //    }
        //}

        //[HttpPut("{taskId}/reject")]
        //public async Task<IActionResult> RejectTask(int taskId, [FromBody] RejectTaskDto rejectDto)
        //{
        //    var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        //    if (string.IsNullOrEmpty(memberId))
        //    {
        //        return Unauthorized();
        //    }

        //    if (string.IsNullOrWhiteSpace(rejectDto?.Reason))
        //    {
        //        return BadRequest("Rejection reason is required.");
        //    }

        //    try
        //    {
        //        await _projectTaskService.RejectTaskAsync(taskId, memberId, rejectDto.Reason);
        //        return Ok();
        //    }
        //    catch (NotFoundException)
        //    {
        //        return NotFound();
        //    }
        //    catch (InvalidOperationException ex)
        //    {
        //        return BadRequest(ex.Message);
        //    }
        //}

        [HttpPost("{taskId}/comments")]
        public async Task<IActionResult> AddComment(int taskId, [FromBody] AddCommentDto commentDto)
        {
            var memeberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memeberId))
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _commentService.AddCommentAsync(taskId, memeberId, commentDto.Content);
                return Ok();
            }
            catch (NotFoundException)
            {
                return NotFound();
            }
        }
        [HttpGet("{id}/progress")]
        public async Task<IActionResult> GetProjectTaskProgress(int id)
        {
            var task = await _projectTaskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(new { Progress = task.Progress });
        }
        [HttpPut("{taskId}/progress")]
        public async Task<IActionResult> UpdateTaskProgress(int taskId, [FromBody] UpdateTaskProgressDto progressDto)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _projectTaskService.UpdateTaskProgressAsync(taskId, memberId, progressDto.Progress);
                return Ok();
            }
            catch (NotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{taskId}/comments")]
        public async Task<IActionResult> GetComments(int taskId)
        {
            var comments = await _commentService.GetCommentsByTaskIdAsync(taskId);
            return Ok(comments);
        }

        [HttpPut("{taskId}/actual-hours")]
        public async Task<IActionResult> UpdateTaskActualHours(int taskId, [FromBody] UpdateTaskActualHoursDto actualHoursDto)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _projectTaskService.UpdateTaskActualHoursAsync(taskId, memberId, actualHoursDto.ActualHours);
                return Ok();
            }
            catch (NotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/acceptcompletion")]
        public async Task<IActionResult> AcceptProjectTaskCompletion(int id)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader is the logged-in user
            try
            {
                await _projectTaskService.AcceptProjectTaskCompletionAsync(id, teamLeaderId);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while accepting the project task completion."); }
        }

        [HttpPut("{id}/rejectcompletion")]
        public async Task<IActionResult> RejectProjectTaskCompletion(int id, [FromBody] string reason)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader is the logged-in user
            try
            {
                await _projectTaskService.RejectProjectTaskCompletionAsync(id, teamLeaderId, reason);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while rejecting the project task completion."); }
        }

        //[HttpPost("{successorTaskId}/dependencies/{predecessorTaskId}")]
        //public async Task<IActionResult> AddDependency(int successorTaskId, int predecessorTaskId)
        //{
        //    try
        //    {
        //        await _projectTaskService.AddDependencyAsync(predecessorTaskId, successorTaskId);
        //        return NoContent(); // Return 204 No Content for successful operation
        //    }
        //    catch (NotFoundException ex)
        //    {
        //        return NotFound(ex.Message); // Return 404 Not Found if either task doesn't exist
        //    }
        //    catch (InvalidOperationException ex)
        //    {
        //        return BadRequest(ex.Message); // Return 400 Bad Request if dependency already exists or other invalid operation
        //    }
        //    catch (Exception ex)
        //    {
        //        // Log the error
        //        return StatusCode(500, "An error occurred while adding the dependency.");
        //    }
        //}
        //[HttpDelete("{successorTaskId}/dependencies/{predecessorTaskId}")]
        //public async Task<IActionResult> RemoveDependency(int successorTaskId, int predecessorTaskId)
        //{
        //    try
        //    {
        //        await _projectTaskService.RemoveDependencyAsync(predecessorTaskId, successorTaskId);
        //        return NoContent(); // Return 204 No Content for successful operation
        //    }
        //    catch (NotFoundException ex)
        //    {
        //        return NotFound(ex.Message); // Return 404 Not Found if either task or dependency doesn't exist
        //    }
        //    catch (Exception ex)
        //    {
        //        // Log the error
        //        return StatusCode(500, "An error occurred while removing the dependency.");
        //    }
        //}
        //[HttpGet("{taskId}/predecessors")]
        //public async Task<ActionResult<IEnumerable<ProjectTaskReadDto>>> GetPredecessors(int taskId)
        //{
        //    var predecessors = await _projectTaskService.GetPredecessorsAsync(taskId);
        //    return Ok(predecessors);
        //}

        //[HttpGet("{taskId}/successors")]
        //public async Task<ActionResult<IEnumerable<ProjectTaskReadDto>>> GetSuccessors(int taskId)
        //{
        //    var successors = await _projectTaskService.GetSuccessorsAsync(taskId);
        //    return Ok(successors);
        //}
        // DELETE: api/ProjectTask/{id}

        [HttpDelete("Delete-task")]
        [Authorize(Policy = "SupervisorOnly")] // Example policy for deletion
        public async Task<IActionResult> DeleteTask(int id)
        {
            var deleted = await _projectTaskService.DeleteTaskAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent(); // Or Ok() with a success message
        }

    }
}