using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using System.Globalization;

namespace ProjectManagementSystem1.Services.TodoItemService
{
    public interface ITodoItemService
    {
        Task<TodoItemReadDto> GetTodoItemByIdAsync(int id);
        Task<IEnumerable<TodoItemReadDto>> GetTodoItemsByProjectTaskIdAsync(int projectTaskId);
        Task<TodoItemReadDto> CreateTodoItemAsync(TodoItemCreateDto createDto, string assignedByMemberId);
        Task<TodoItemReadDto> UpdateTodoItemAsync(int id, TodoItemUpdateDto updateDto);
        Task AcceptAssignmentAsync(int id, string memberId); 
        Task AcceptTodoAfterApprovalAsync(int id, string memberId);

        Task ReopenRejectedTodoAsync(int id, string memberId);
        Task RejectAssignmentAsync(int id, string memberId, string reason);
        Task RejectTodoAfterCompletionAsync(int id, string teamLeaderId, string reason);

            //Task AcceptTodoItemAsync(int id, string memberId); // Added this
            //Task RejectTodoItemAsync(int id, string memberId, string? reason); // Added this
        Task CompleteTodoItemAsync(int id, string memberId, int progress, string? detailsForLateCompletion, string? completionDetails);
        Task StartTodoItemAsync(int id, string memberId);
        Task ApproveTodoItemAsync(int id, string teamLeaderId);
        //Task RejectCompletedTodoItemAsync(int id, string teamLeaderId, string reason);
        Task<bool> DeleteTodoItemAsync(int id);
    }
}