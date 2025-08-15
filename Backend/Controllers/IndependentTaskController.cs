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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var tasks = await _independentTaskService.GetIndependentTasksByUserAsync(userId);
            return Ok(_mapper.Map<List<IndependentTaskReadDto>>(tasks));
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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.AcceptTaskAssignmentAsync(taskId, userId);
            return NoContent();
        }

        [HttpPost("{taskId}/reject")]
        public async Task<IActionResult> RejectTaskAssignment(int taskId, [FromBody] RejectTaskRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.RejectTaskAssignmentAsync(taskId, userId, request.Reason);
            return NoContent();
        }

        [HttpPut("{taskId}/progress")]
        public async Task<IActionResult> UpdateProgress(int taskId, [FromBody] UpdateProgressRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.UpdateTaskProgressAsync(taskId, userId, request.Progress, request.Comments);
            return NoContent();
        }

        [HttpPost("{taskId}/complete")]
        public async Task<IActionResult> CompleteTask(int taskId, [FromBody] CompleteTaskRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _independentTaskService.CompleteTaskAsync(taskId, userId, request.CompletionDetails);
            return NoContent();
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