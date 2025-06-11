using ProjectManagementSystem1.Model.Dto.TodoItemsDto;

namespace ProjectManagementSystem1.Services.TodoItemService
{
    public interface ITodoItemService
    {
        Task<TodoItemReadDto> GetTodoItemByIdAsync(int id);
        Task<IEnumerable<TodoItemReadDto>> GetTodoItemsByProjectTaskIdAsync(int projectTaskId);
        Task<TodoItemReadDto> CreateTodoItemAsync(TodoItemCreateDto createDto);
        Task<TodoItemReadDto> UpdateTodoItemAsync(int id, TodoItemUpdateDto updateDto);
        Task AcceptTodoItemAsync(int id, string memberId); // Added this
        Task RejectTodoItemAsync(int id, string memberId, string? reason); // Added this
        Task<bool> DeleteTodoItemAsync(int id);
    }
}
