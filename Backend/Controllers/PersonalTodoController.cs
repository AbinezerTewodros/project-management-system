using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Controllers.Base;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.PersonalTodoDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.NotificationService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    /// <summary>
    /// Controller for managing personal todo items with enhanced functionality including due dates, progress tracking, and deadline alerts.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PersonalTodoController : BaseApiController
    {
        private readonly IPersonalTodoService _personalTodoService;
        private readonly INotificationService _notificationService;

        public PersonalTodoController(IPersonalTodoService personalTodoService, 
            INotificationService notificationService, ILogger<PersonalTodoController> logger)
            : base(logger)
        {
            _personalTodoService = personalTodoService;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Retrieves a specific personal todo by ID.
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <returns>The personal todo item</returns>
        /// <response code="200">Returns the personal todo</response>
        /// <response code="404">If the todo is not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> GetPersonalTodoById(int id)
        {
            try
            {
                var todo = await _personalTodoService.GetPersonalTodoByIdAsync(id);
                if (todo == null)
                {
                    return NotFoundResponse("Personal todo not found");
                }
                return SuccessResponse(todo, "Personal todo retrieved successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error retrieving personal todo");
            }
        }

        /// <summary>
        /// Retrieves all personal todos for the current user.
        /// </summary>
        /// <returns>List of personal todos</returns>
        /// <response code="200">Returns the list of personal todos</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<PersonalTodoReadDto>>), 200)]
        public async Task<IActionResult> GetPersonalTodosByUser()
        {
            try
            {
                var userId = GetCurrentUserId();
                var todos = await _personalTodoService.GetPersonalTodosByUserAsync(userId);
                return SuccessResponse(todos.ToList(), "Personal todos retrieved successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error retrieving personal todos");
            }
        }

        /// <summary>
        /// Retrieves personal todos with optional filters.
        /// </summary>
        /// <param name="status">Filter by status</param>
        /// <param name="priority">Filter by priority</param>
        /// <param name="isOverdue">Filter by overdue status</param>
        /// <param name="tags">Filter by tags (comma-separated)</param>
        /// <returns>Filtered list of personal todos</returns>
        /// <response code="200">Returns the filtered list of personal todos</response>
        [HttpGet("filter")]
        [ProducesResponseType(typeof(ApiResponse<List<PersonalTodoReadDto>>), 200)]
        public async Task<IActionResult> GetPersonalTodosWithFilters(
            [FromQuery] PersonalTodoStatus? status = null,
            [FromQuery] PersonalTodoPriority? priority = null,
            [FromQuery] bool? isOverdue = null,
            [FromQuery] string? tags = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var todos = await _personalTodoService.GetPersonalTodosByUserWithFiltersAsync(
                    userId, status, priority, isOverdue, tags);
                return SuccessResponse(todos.ToList(), "Filtered personal todos retrieved successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error retrieving filtered personal todos");
            }
        }

        /// <summary>
        /// Retrieves overdue personal todos for the current user.
        /// </summary>
        /// <returns>List of overdue personal todos</returns>
        /// <response code="200">Returns the list of overdue personal todos</response>
        [HttpGet("overdue")]
        [ProducesResponseType(typeof(ApiResponse<List<PersonalTodoReadDto>>), 200)]
        public async Task<IActionResult> GetOverdueTodos()
        {
            try
            {
                var userId = GetCurrentUserId();
                var todos = await _personalTodoService.GetOverdueTodosAsync(userId);
                return SuccessResponse(todos.ToList(), "Overdue personal todos retrieved successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error retrieving overdue personal todos");
            }
        }

        /// <summary>
        /// Retrieves personal todos that need reminders.
        /// </summary>
        /// <returns>List of todos needing reminders</returns>
        /// <response code="200">Returns the list of todos needing reminders</response>
        [HttpGet("reminders")]
        [ProducesResponseType(typeof(ApiResponse<List<PersonalTodoReadDto>>), 200)]
        public async Task<IActionResult> GetTodosNeedingReminders()
        {
            try
            {
                var userId = GetCurrentUserId();
                var todos = await _personalTodoService.GetTodosNeedingRemindersAsync(userId);
                return SuccessResponse(todos.ToList(), "Todos needing reminders retrieved successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error retrieving todos needing reminders");
            }
        }

        /// <summary>
        /// Creates a new personal todo item.
        /// </summary>
        /// <param name="createDto">The todo creation data</param>
        /// <returns>The created personal todo</returns>
        /// <response code="201">Returns the created personal todo</response>
        /// <response code="400">If the input data is invalid</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        public async Task<IActionResult> CreatePersonalTodo([FromBody] PersonalTodoCreateDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return ValidationErrorResponse(ModelState);
                }

                var userId = GetCurrentUserId();
                var createdTodo = await _personalTodoService.CreatePersonalTodoAsync(createDto, userId);
                
                // Send notification for todo creation
                try
                {
                    await _notificationService.NotifyPersonalTodoDueAsync(createdTodo.TodoId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to send todo creation notification: {ex.Message}");
                }
                
                return CreatedResponse(createdTodo, nameof(GetPersonalTodoById), new { id = createdTodo.TodoId }, "Personal todo created successfully");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error creating personal todo");
            }
        }

        /// <summary>
        /// Updates an existing personal todo item.
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <param name="updateDto">The todo update data</param>
        /// <returns>The updated personal todo</returns>
        /// <response code="200">Returns the updated personal todo</response>
        /// <response code="400">If the input data is invalid</response>
        /// <response code="404">If the todo is not found</response>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> UpdatePersonalTodo(int id, [FromBody] PersonalTodoUpdateDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return ValidationErrorResponse(ModelState);
                }

                var userId = GetCurrentUserId();
                var updatedTodo = await _personalTodoService.UpdatePersonalTodoAsync(id, updateDto, userId);
                
                if (updatedTodo == null)
                {
                    return NotFoundResponse("Personal todo not found");
                }

                return SuccessResponse(updatedTodo, "Personal todo updated successfully");
            }
            catch (UnauthorizedAccessException ex)
            {
                return UnauthorizedResponse(ex.Message);
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error updating personal todo");
            }
        }

        /// <summary>
        /// Deletes a personal todo item.
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <returns>Success confirmation</returns>
        /// <response code="200">If the todo was deleted successfully</response>
        /// <response code="404">If the todo is not found</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse), 200)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> DeletePersonalTodo(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var deleted = await _personalTodoService.DeletePersonalTodoAsync(id, userId);
                
                if (!deleted)
                {
                    return NotFoundResponse("Personal todo not found");
                }

                return SuccessResponse("Personal todo deleted successfully");
            }
            catch (UnauthorizedAccessException ex)
            {
                return UnauthorizedResponse(ex.Message);
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error deleting personal todo");
            }
        }

        /// <summary>
        /// Starts a personal todo (changes status to InProgress).
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <returns>The updated personal todo</returns>
        /// <response code="200">Returns the updated personal todo</response>
        /// <response code="404">If the todo is not found</response>
        [HttpPut("{id}/start")]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> StartTodo(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updatedTodo = await _personalTodoService.StartTodoAsync(id, userId);
                
                if (updatedTodo == null)
                {
                    return NotFoundResponse("Personal todo not found");
                }

                return SuccessResponse(updatedTodo, "Personal todo started successfully");
            }
            catch (UnauthorizedAccessException ex)
            {
                return UnauthorizedResponse(ex.Message);
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error starting personal todo");
            }
        }

        /// <summary>
        /// Completes a personal todo (changes status to Completed).
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <returns>The updated personal todo</returns>
        /// <response code="200">Returns the updated personal todo</response>
        /// <response code="404">If the todo is not found</response>
        [HttpPut("{id}/complete")]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> CompleteTodo(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updatedTodo = await _personalTodoService.CompleteTodoAsync(id, userId);
                
                if (updatedTodo == null)
                {
                    return NotFoundResponse("Personal todo not found");
                }

                // Send notification for todo completion
                try
                {
                    await _notificationService.NotifyPersonalTodoCompletedAsync(id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to send todo completion notification: {ex.Message}");
                }

                return SuccessResponse(updatedTodo, "Personal todo completed successfully");
            }
            catch (UnauthorizedAccessException ex)
            {
                return UnauthorizedResponse(ex.Message);
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error completing personal todo");
            }
        }

        /// <summary>
        /// Updates the progress of a personal todo.
        /// </summary>
        /// <param name="id">The todo ID</param>
        /// <param name="progress">The progress percentage (0-100)</param>
        /// <returns>The updated personal todo</returns>
        /// <response code="200">Returns the updated personal todo</response>
        /// <response code="400">If the progress value is invalid</response>
        /// <response code="404">If the todo is not found</response>
        [HttpPut("{id}/progress")]
        [ProducesResponseType(typeof(ApiResponse<PersonalTodoReadDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        public async Task<IActionResult> UpdateProgress(int id, [FromQuery] int progress)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updatedTodo = await _personalTodoService.UpdateProgressAsync(id, progress, userId);
                
                if (updatedTodo == null)
                {
                    return NotFoundResponse("Personal todo not found");
                }

                return SuccessResponse(updatedTodo, "Progress updated successfully");
            }
            catch (ArgumentException ex)
            {
                return BadRequestResponse(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return UnauthorizedResponse(ex.Message);
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex, "Error updating progress");
            }
        }

        private new string GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }
            return userId;
        }
    }
}