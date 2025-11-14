using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Dto.IndependentTaskDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Model.Exceptions;
using BusinessUnauthorizedAccessException = ProjectManagementSystem1.Model.Exceptions.UnauthorizedAccessException;
using AutoMapper;
using System.ComponentModel.DataAnnotations;


namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/independent-tasks")]
    [Authorize]
    public class IndependentTaskController : ControllerBase
    {
        private readonly IIndependentTaskService _independentTaskService;
        private readonly IMapper _mapper;

        public IndependentTaskController(
            IIndependentTaskService independentTaskService,
            IMapper mapper)
        {
            _independentTaskService = independentTaskService;
            _mapper = mapper;
        }

        [HttpGet("{id}", Name = "GetIndependentTask")]
        public async Task<ActionResult<IndependentTaskReadDto>> GetIndependentTaskById(int id)
        {
            var task = await _independentTaskService.GetIndependentTaskByIdAsync(id);
            if (task == null) return NotFound();

            return Ok(_mapper.Map<IndependentTaskReadDto>(task));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IndependentTaskReadDto>>> GetAllIndependentTasks()
        {
            var tasks = await _independentTaskService.GetAllIndependentTasksAsync();
            return Ok(_mapper.Map<List<IndependentTaskReadDto>>(tasks));
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<IndependentTaskReadDto>>> GetIndependentTasksByUser()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId)) 
                    return Unauthorized(new { error = "User not authenticated" });

                var tasks = await _independentTaskService.GetIndependentTasksByUserAsync(userId);
                return Ok(_mapper.Map<List<IndependentTaskReadDto>>(tasks));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving user tasks", details = ex.Message });
            }
        }

        /// <summary>
        /// Gets all tasks created by the current user (not assigned to them)
        /// </summary>
        [HttpGet("created")]
        public async Task<ActionResult<IEnumerable<IndependentTaskReadDto>>> GetTasksCreatedByUser()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId)) 
                    return Unauthorized(new { error = "User not authenticated" });

                var tasks = await _independentTaskService.GetTasksCreatedByUserAsync(userId);
                return Ok(_mapper.Map<List<IndependentTaskReadDto>>(tasks));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while retrieving created tasks", details = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<IndependentTaskReadDto>> CreateIndependentTask(
            [FromBody] IndependentTaskCreateDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var createdTask = await _independentTaskService.CreateIndependentTaskAsync(createDto, userId);
            var readDto = _mapper.Map<IndependentTaskReadDto>(createdTask);

            return CreatedAtRoute(
                "GetIndependentTask",
                new { id = readDto.TaskId },
                readDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIndependentTask(int id, [FromBody] IndependentTaskUpdateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (id != updateDto.TaskId) return BadRequest("ID mismatch");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var updatedTask = await _independentTaskService.UpdateIndependentTaskAsync(id, updateDto, userId);

            if (updatedTask == null) return NotFound();

            return Ok(_mapper.Map<IndependentTaskReadDto>(updatedTask));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIndependentTask(int id)
        {
            var success = await _independentTaskService.DeleteIndependentTaskAsync(id);
            return success ? NoContent() : NotFound();
        }

        [HttpPost("{taskId}/accept")]
        public async Task<IActionResult> AcceptTaskAssignment(int taskId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "User not authenticated" });

                await _independentTaskService.AcceptTaskAssignmentAsync(taskId, userId);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (BusinessUnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An unexpected error occurred while accepting task assignment", details = ex.Message });
            }
        }

        [HttpPost("{taskId}/reject")]
        public async Task<IActionResult> RejectTaskAssignment(int taskId, [FromBody] RejectTaskRequest request)
        {
            try
            {
                if (!ModelState.IsValid) 
                    return BadRequest(new { error = "Invalid request data", details = ModelState });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "User not authenticated" });

                await _independentTaskService.RejectTaskAssignmentAsync(taskId, userId, request.Reason);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (BusinessUnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An unexpected error occurred while rejecting task assignment", details = ex.Message });
            }
        }

        [HttpPut("{taskId}/progress")]
        public async Task<IActionResult> UpdateProgress(int taskId, [FromBody] UpdateProgressRequest request)
        {
            try
            {
                if (!ModelState.IsValid) 
                    return BadRequest(new { error = "Invalid request data", details = ModelState });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "User not authenticated" });

                await _independentTaskService.UpdateTaskProgressAsync(taskId, userId, request.Progress, request.Comments);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (BusinessUnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentOutOfRangeException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception here
                return StatusCode(500, new { error = "An unexpected error occurred while updating task progress", details = ex.Message });
            }
        }

        [HttpPost("{taskId}/complete")]
        public async Task<IActionResult> CompleteTask(int taskId, [FromBody] CompleteTaskRequest request)
        {
            try
            {
                if (!ModelState.IsValid) 
                    return BadRequest(new { error = "Invalid request data", details = ModelState });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "User not authenticated" });

                await _independentTaskService.CompleteTaskAsync(taskId, userId, request.CompletionDetails);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (BusinessUnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An unexpected error occurred while completing the task", details = ex.Message });
            }
        }

        [HttpPost("{taskId}/approve")]
        [Authorize(Roles = "Manager,TeamLead")]
        public async Task<IActionResult> ApproveCompletion(int taskId, [FromBody] ApproveTaskRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.ApproveTaskCompletionAsync(taskId, userId, request.Comments);
            return NoContent();
        }

        [HttpPost("{taskId}/reject-completion")]
        [Authorize(Roles = "Manager,TeamLead")]
        public async Task<IActionResult> RejectCompletion(int taskId, [FromBody] RejectCompletionRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.RejectTaskCompletionAsync(taskId, userId, request.Reason);
            return NoContent();
        }

        
        //[HttpGet("{taskId}/comments")]
        //public async Task<ActionResult<IEnumerable<Comment>>> GetComments(int taskId)
        //{
        //    var comments = await _independentTaskService.GetCommentsAsync(taskId);
        //    return Ok(_mapper.Map<List<CommentDto>>(comments));
        //}

        //[HttpPost("{taskId}/comments")]
        //public async Task<ActionResult<CommentDto>> AddComment(int taskId, [FromBody] AddCommentRequest request)
        //{
        //    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    var comment = await _independentTaskService.AddCommentAsync(taskId, userId, request.Content);
        //    return Ok(_mapper.Map<CommentDto>(comment));
        //}
    }

    public class RejectTaskRequest
    {
        [Required]
        public string Reason { get; set; }
    }

    public class UpdateProgressRequest
    {
        [Range(0, 100)]
        public int Progress { get; set; }
        public string Comments { get; set; }
    }

    public class CompleteTaskRequest
    {
        [Required]
        public string CompletionDetails { get; set; }
    }

    public class ApproveTaskRequest
    {
        public string Comments { get; set; }
    }

    public class RejectCompletionRequest
    {
        [Required]
        public string Reason { get; set; }
    }

    public class AddCommentRequest
    {
        [Required]
        public string Content { get; set; }
    }
}