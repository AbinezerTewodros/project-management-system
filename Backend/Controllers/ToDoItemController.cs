using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Model.Dto.ProjectTaskDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
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
            var todoItem = await _todoItemService.CreateTodoItemAsync(createDto);
            return CreatedAtAction(nameof(GetTodoItemById), new { id = todoItem.Id }, todoItem);
        }

        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptTodoItem(int id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            try
            {
                await _todoItemService.AcceptTodoItemAsync(id, memberId);
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

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectTodoItem(int id, [FromBody] RejectTodoItemDto rejectDto)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            try
            {
                await _todoItemService.RejectTodoItemAsync(id, memberId, rejectDto.Reason);
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
            if (existingTodoItem.Status != TodoItemStatus.Accepted)
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
