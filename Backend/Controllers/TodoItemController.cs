using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Model.Dto.ProjectTaskDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services.TodoItemService;
using ProjectManagementSystem1.Services.AccessLogService;
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
        private readonly IAccessLogService _accessLogService;

        public TodoItemController(ITodoItemService todoItemService, IProjectTaskService projectTaskService, IAccessLogService accessLogService)
        {
            _todoItemService = todoItemService;
            _projectTaskService = projectTaskService;
            _accessLogService = accessLogService;
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

        //[HttpPut("{id}/accept")]
        //public async Task<IActionResult> AcceptTodoItem(int id)
        //{
        //    var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    try
        //    {
        //        await _todoItemService.AcceptTodoItemAsync(id, memberId);
        //        return Ok("Todo item accepted successfully.");
        //    }
        //    catch (NotFoundException ex) { return NotFound(ex.Message); }
        //    catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        //    catch (Exception ex) { return StatusCode(500, $"An error occurred while accepting the todo item: {ex.Message}"); }
        //}

        [HttpPut("{id}/accept-assignment")]
        public async Task<IActionResult> AcceptAssignment(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _todoItemService.AcceptAssignmentAsync(id, memberId);
            return Ok(new { message = "Assignment accepted successfully" });
        }

        [HttpPut("{id}/acceptapproval")]
        public async Task<IActionResult> AcceptTodoAfterApproval(int id)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader makes this action
            var userEmail = User.FindFirstValue(ClaimTypes.Email);

            try
            {
                await _todoItemService.ApproveTodoItemAsync(id, teamLeaderId);
                
                // Log the approval action
                await _accessLogService.LogAccessAsync(
                    userId: teamLeaderId,
                    userEmail: userEmail,
                    action: "TodoItem Approval",
                    status: "Success",
                    endpoint: $"/api/todoitems/{id}/acceptapproval",
                    httpMethod: "PUT",
                    httpStatusCode: 204
                );
                
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception) { return StatusCode(500, "An error occurred while accepting the approval."); }
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
            catch (Exception) { return StatusCode(500, "An error occurred while rejecting the assignment."); }
        }

        [HttpPut("{id}/rejectcompletion")]
        public async Task<IActionResult> RejectTodoAfterCompletion(int id, [FromBody] string reason)
        {
            var teamLeaderId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Assuming Team Leader makes this action
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            
            try
            {
                await _todoItemService.RejectTodoAfterCompletionAsync(id, teamLeaderId, reason);
                
                // Log the rejection action
                await _accessLogService.LogAccessAsync(
                    userId: teamLeaderId,
                    userEmail: userEmail,
                    action: "TodoItem Rejection",
                    status: "Success",
                    endpoint: $"/api/todoitems/{id}/rejectcompletion",
                    httpMethod: "PUT",
                    httpStatusCode: 204,
                    errorMessage: reason
                );
                
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
            catch (Exception) { return StatusCode(500, "An error occurred while rejecting the completed todo."); }
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
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _todoItemService.StartTodoItemAsync(id, memberId);
            return Ok(new { message = "Todo item started successfully" });
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
            catch (Exception) { return StatusCode(500, "An error occurred while completing the todo item."); }
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
                return BadRequest("Progress can only be updated for accepted TodoItems that are in progress.");
            }

            var updateDto = new TodoItemUpdateDto { Progress = progressDto.Progress };
            var updatedTodoItem = await _todoItemService.UpdateTodoItemAsync(id, updateDto);

            if (updatedTodoItem != null)
            {
                // IMPORTANT: Do NOT update parent ProjectTask progress here
                // Progress will only be updated when the team leader approves completion
                // This ensures that partial progress doesn't affect the overall project progress
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