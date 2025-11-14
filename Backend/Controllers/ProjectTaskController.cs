using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenQA.Selenium;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.Milestone;
using ProjectManagementSystem1.Model.Dto.ProjectTaskDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.CommentService;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Services.ProjectTaskService;
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
        private readonly MilestoneTaskValidator _milestoneValidator;

        public ProjectTaskController(IProjectTaskService projectTaskService, ICommentService commentService, 
            INotificationService notificationService, ILogger<ProjectTaskController> logger,
            MilestoneTaskValidator milestoneValidator)
        {
            _projectTaskService = projectTaskService;
            _commentService = commentService;
            _notification = notificationService;
            _logger = logger;
            _milestoneValidator = milestoneValidator;
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

                if (dto.MilestoneId.HasValue)
                {
                    await _notification.SendNotificationAsync(
                        memberId,
                        "Task Added to Milestone",
                        $"Task '{task.Title}' was added to milestone",
                        "TaskAddedToMilestone",
                        "Milestone",
                        dto.MilestoneId.Value
                    );
                }



                try
                {
                    await _notification.SendNotificationAsync(
                        User.FindFirstValue(ClaimTypes.NameIdentifier), // Send to the user creating the task
                        "Test Email Notification",
                        $"This is a test email notification from your Project Management System to verify email sending functionality.",
                        "TestEmail",
                        "ProjectTask",
                        task.Id
                    );
                }
                catch (Exception ex)
                {
                    // Log the error but don't break the task creation
                    _logger.LogError($"Error sending test email: {ex.Message}");
                }
                //return Ok(MapToResponseDto(task));
                return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, MapToResponseDto(task));

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

        [HttpGet("filter")]
        public async Task<IActionResult> FilterTasks(
            [FromQuery] int? projectAssignmentId = null,
            [FromQuery] string? assignedMemberId = null,
            [FromQuery] int? milestoneId = null,
            [FromQuery] string? description = null,
            [FromQuery] ProjectManagementSystem1.Model.Entities.TaskStatus? status = null,
            [FromQuery] TaskPriority? priority = null,
            [FromQuery] int? depth = null,
            [FromQuery] bool? isLeaf = null,
            [FromQuery] DateTime? dueDateBefore = null,
            [FromQuery] DateTime? dueDateAfter = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var filter = new ProjectTaskFilterDto
            {
                ProjectAssignmentId = projectAssignmentId,
                AssignedMemberId = assignedMemberId,
                MilestoneId = milestoneId,
                Description = description,
                Status = status,
                Priority = priority,
                Depth = depth,
                IsLeaf = isLeaf,
                DueDateBefore = dueDateBefore,
                DueDateAfter = dueDateAfter,
                SearchTerm = searchTerm,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await _projectTaskService.GetFilteredTasksAsync(filter);

            // Map items to DTOs
            var mappedItems = result.Items.Select(MapToResponseDto).ToList();

            // Return with mapped items
            return Ok(new PaginatedResult<ProjectTaskReadDto>(
                mappedItems,
                result.TotalCount,
                result.PageNumber,
                result.PageSize
            ));
        }
        // Specialized endpoints for common cases
        [HttpGet("by-assignment/{assignmentId}")]
        public async Task<IActionResult> GetTasksByAssignment(int assignmentId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var filter = new ProjectTaskFilterDto
            {
                ProjectAssignmentId = assignmentId,
                PageNumber = page,
                PageSize = pageSize
            };
            var result = await _projectTaskService.GetFilteredTasksAsync(filter);
            var mappedItems = result.Items.Select(MapToResponseDto).ToList();
            return Ok(new PaginatedResult<ProjectTaskReadDto>(
                mappedItems,
                result.TotalCount,
                result.PageNumber,
                result.PageSize
            ));
        }

        [HttpGet("by-member/{memberId}")]
        public async Task<IActionResult> GetTasksByMember(string memberId,
            [FromQuery] ProjectManagementSystem1.Model.Entities.TaskStatus? status = null,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var filter = new ProjectTaskFilterDto
            {
                AssignedMemberId = memberId,
                Status = (Model.Entities.TaskStatus?)status,
                PageNumber = page,
                PageSize = pageSize
            };
            var result = await _projectTaskService.GetFilteredTasksAsync(filter);
            var mappedItems = result.Items.Select(MapToResponseDto).ToList();
            return Ok(new PaginatedResult<ProjectTaskReadDto>(
                mappedItems,
                result.TotalCount,
                result.PageNumber,
                result.PageSize
            ));
        }

        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetTasksByStatus(ProjectManagementSystem1.Model.Entities.TaskStatus status,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var filter = new ProjectTaskFilterDto
            {
                Status = (Model.Entities.TaskStatus?)status,
                PageNumber = page,
                PageSize = pageSize
            };
            var result = await _projectTaskService.GetFilteredTasksAsync(filter);
            var mappedItems = result.Items.Select(MapToResponseDto).ToList();
            return Ok(new PaginatedResult<ProjectTaskReadDto>(
                mappedItems,
                result.TotalCount,
                result.PageNumber,
                result.PageSize
            ));
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
                CreatedByUserId = task.CreatedByUserId, // ✅ NEW: Include task creator
                ParentTaskId = task.ParentTaskId,
                Depth = task.Depth,
                IsLeaf = task.IsLeaf,
                Progress = task.Progress,
                Weight = task.Weight,
                Priority = task.Priority,  // ✅ FIXED: Uncommented!
                Status = task.Status,      // ✅ FIXED: Uncommented!
                EstimatedHours = task.EstimatedHours,
                ActualHours = task.ActualHours,
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                SubTasks = task.SubTasks.Select(MapToResponseDto).ToList(),
                TodoItems = task.TodoItems.Select(MapTodoItemToReadDto).ToList()
            };
        }

        [HttpPost("validate-milestone-dates")]
        public async Task<IActionResult> ValidateMilestoneDates([FromBody] ValidateMilestoneDatesDto dto)
        {
            try
            {
                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    dto.MilestoneId,
                    dto.TaskStartDate,
                    dto.TaskDueDate);

                return Ok(new { Valid = true });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Valid = false, Error = ex.Message });
            }
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
            try
            {
                var tasks = await _projectTaskService.GetAllTasksAsync();
                
                // Prevent circular reference issues by mapping to DTOs without recursive subtasks
                var taskDtos = tasks.Select(t => new ProjectTaskReadDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    ProjectAssignmentId = t.ProjectAssignmentId,
                    AssignedMemberId = t.AssignedMemberId,
                    ParentTaskId = t.ParentTaskId,
                    Depth = t.Depth,
                    IsLeaf = t.IsLeaf,
                    Progress = t.Progress,
                    Weight = t.Weight,
                    EstimatedHours = t.EstimatedHours,
                    ActualHours = t.ActualHours,
                    DueDate = t.DueDate,
                    CreatedAt = t.CreatedAt,
                    SubTasks = new List<ProjectTaskReadDto>(), // Empty to prevent circular refs
                    TodoItems = t.TodoItems?.Select(MapTodoItemToReadDto).ToList() ?? new List<TodoItemReadDto>()
                }).ToList();

                _logger.LogInformation("Successfully retrieved {Count} tasks", taskDtos.Count);
                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all tasks");
                return StatusCode(500, new { message = "An error occurred while retrieving tasks", error = ex.Message });
            }
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

        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptTask(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _projectTaskService.AcceptTaskAssignmentAsync(id, memberId);
            return NoContent();
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectTask(int id, [FromBody] string reason)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _projectTaskService.RejectTaskAssignmentAsync(id, memberId, reason);
            return NoContent();
        }

        [HttpPut("{id}/acceptcompletion")]
        public async Task<IActionResult> AcceptProjectTaskCompletion(int id)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader is the logged-in user
            try
            {
                var task = await _projectTaskService.GetTaskByIdAsync(id);

                if (task?.MilestoneId != null)
                {

                }
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

        //[HttpGet("milestone/{milestoneId}/progress")]
        //public async Task<ActionResult<double>> GetMilestoneProgress(int milestoneId)
        //{
        //    try
        //    {
        //        // This would call a new service method that calculates milestone progress
        //        var progress = await _projectTaskService.CalculateMilestoneProgress(milestoneId);
        //        return Ok(new { Progress = progress });
        //    }
        //    catch (NotFoundException)
        //    {
        //        return NotFound();
        //    }
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