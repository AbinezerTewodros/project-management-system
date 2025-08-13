using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Model.Dto.ProjectTaskDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services.TodoItemService;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/todoitems")]
    public class TodoItemController : ControllerBase
    {
        private readonly ITodoItemService _todoItemService;
        private readonly IProjectTaskService _projectTaskService;

        public TodoItemController(ITodoItemService todoItemService, IProjectTaskService projectTaskService)
        {
            _todoItemService = todoItemService;
            _projectTaskService = projectTaskService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTodoItemById(int id)
        {
            var todoItem = await _todoItemService.GetTodoItemByIdAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }
            return Ok(todoItem);
        }

        [HttpGet("projecttask/{projectTaskId}")]
        public async Task<IActionResult> GetTodoItemsByProjectTaskId(int projectTaskId)
        {
            var todoItems = await _todoItemService.GetTodoItemsByProjectTaskIdAsync(projectTaskId);
            return Ok(todoItems);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTodoItem([FromBody] TodoItemCreateDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var assignerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(assignerId))
            {
                return Unauthorized();
            }

            var todoItem = await _todoItemService.CreateTodoItemAsync(createDto, assignerId);
            return CreatedAtAction(nameof(GetTodoItemById), new { id = todoItem.Id }, todoItem);
        }

       

        [HttpPut("{id}/acceptassignment")]
        public async Task<IActionResult> AcceptAssignment(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _todoItemService.AcceptAssignmentAsync(id, memberId);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while accepting the assignment."); }
        }

        [HttpPut("{id}/acceptapproval")]
        public async Task<IActionResult> AcceptTodoAfterApproval(int id)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader makes this action

            try
            {
                await _todoItemService.ApproveTodoItemAsync(id, teamLeaderId);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while accepting the approval."); }
        }

        [HttpPut("{id}/rejectassignment")]
        public async Task<IActionResult> RejectAssignment(int id, [FromBody] string reason)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _todoItemService.RejectAssignmentAsync(id, memberId, reason);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while rejecting the assignment."); }
        }

        [HttpPut("{id}/rejectcompletion")]
        public async Task<IActionResult> RejectTodoAfterCompletion(int id, [FromBody] string reason)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader makes this action
            try
            {
                await _todoItemService.RejectTodoAfterCompletionAsync(id, teamLeaderId, reason);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while rejecting the completed todo."); }
        }

        // In TodoItemController.cs
        [HttpPut("{id}/reopen")]
        public async Task<IActionResult> ReopenRejectedTodo(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _todoItemService.ReopenRejectedTodoAsync(id, memberId);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(ex.Message); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTodoItem(int id, [FromBody] TodoItemUpdateDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var updatedTodoItem = await _todoItemService.UpdateTodoItemAsync(id, updateDto);
            if (updatedTodoItem == null)
            {
                return NotFound();
            }
            return Ok(updatedTodoItem);
        }


        [HttpPut("{id}/start")]
        public async Task<IActionResult> StartTodoItem(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming you have user authentication
            try
            {
                await _todoItemService.StartTodoItemAsync(id, memberId);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while starting the todo item."); }
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteTodoItem(int id, [FromQuery] int progress, string? detailsForLateCompletion, string? completionDetails)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                await _todoItemService.CompleteTodoItemAsync(id, memberId, progress, detailsForLateCompletion, completionDetails);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception ex) { return StatusCode(500, "An error occurred while completing the todo item."); }
        }

        [HttpPut("{id}/progress")]
        public async Task<IActionResult> UpdateTodoItemProgress(int id, [FromBody] UpdateTaskProgressDto progressDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingTodoItem = await _todoItemService.GetTodoItemByIdAsync(id);
            if (existingTodoItem == null)
            {
                return NotFound();
            }

            // Enhancement: Check if the TodoItem has been accepted before allowing progress update
            if (existingTodoItem.Status != TodoItemStatus.InProgress)
            {
                return BadRequest("Progress can only be updated for accepted TodoItems.");
            }

            var updateDto = new TodoItemUpdateDto { Progress = progressDto.Progress };
            var updatedTodoItem = await _todoItemService.UpdateTodoItemAsync(id, updateDto);

            if (updatedTodoItem != null)
            {
                // Trigger update of parent ProjectTask's progress
                var todoItemEntity = await _todoItemService.GetTodoItemByIdAsync(id); // Need the entity to get ProjectTaskId
                if (todoItemEntity != null)
                {
                    await _projectTaskService.UpdateParentTaskProgressAsync(todoItemEntity.ProjectTaskId);
                }
                return Ok(updatedTodoItem);
            }

            return NotFound();
        }

        [HttpGet("{id}/progress")]
        public async Task<IActionResult> GetTodoItemProgress(int id)
        {
            var todoItem = await _todoItemService.GetTodoItemByIdAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }
            return Ok(new { Progress = todoItem.Progress });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(int id)
        {
            var deleted = await _todoItemService.DeleteTodoItemAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}