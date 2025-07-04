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
    public class PersonalTodoController : ControllerBase
    {
        private readonly IPersonalTodoService _personalTodoService;

        public PersonalTodoController(IPersonalTodoService personalTodoService)
        {
            _personalTodoService = personalTodoService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PersonalTodo>> GetPersonalTodoById(int id)
        {
            var todo = await _personalTodoService.GetPersonalTodoByIdAsync(id);
            if (todo == null)
            {
                return NotFound();
            }
            return Ok(todo);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PersonalTodo>>> GetAllPersonalTodos()
        {
            var todos = await _personalTodoService.GetAllPersonalTodosAsync();
            return Ok(todos);
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<PersonalTodo>>> GetPersonalTodosByUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            var todos = await _personalTodoService.GetPersonalTodosByUserAsync(userId);
            return Ok(todos);
        }

        [HttpPost]
        public async Task<ActionResult<PersonalTodo>> CreatePersonalTodo([FromBody] PersonalTodo todo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            todo.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var createdTodo = await _personalTodoService.CreatePersonalTodoAsync(todo);
            return CreatedAtAction(nameof(GetPersonalTodoById), new { id = createdTodo.TodoId }, createdTodo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePersonalTodo(int id, [FromBody] PersonalTodo todo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (id != todo.TodoId)
            {
                return BadRequest("The ID in the URL does not match the ID in the request body.");
            }
            var updatedTodo = await _personalTodoService.UpdatePersonalTodoAsync(id, todo);
            if (updatedTodo == null)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePersonalTodo(int id)
        {
            var result = await _personalTodoService.DeletePersonalTodoAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}