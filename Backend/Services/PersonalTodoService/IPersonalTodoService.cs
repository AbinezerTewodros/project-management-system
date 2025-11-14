using ProjectManagementSystem1.Model.Dto.PersonalTodoDto;
using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IPersonalTodoService
    {
        Task<PersonalTodoReadDto> GetPersonalTodoByIdAsync(int id);
        Task<IEnumerable<PersonalTodoReadDto>> GetAllPersonalTodosAsync();
        Task<IEnumerable<PersonalTodoReadDto>> GetPersonalTodosByUserAsync(string userId);
        Task<IEnumerable<PersonalTodoReadDto>> GetPersonalTodosByUserWithFiltersAsync(
            string userId, 
            PersonalTodoStatus? status = null, 
            PersonalTodoPriority? priority = null, 
            bool? isOverdue = null,
            string? tags = null);
        Task<IEnumerable<PersonalTodoReadDto>> GetOverdueTodosAsync(string userId);
        Task<IEnumerable<PersonalTodoReadDto>> GetTodosNeedingRemindersAsync(string userId);
        Task<PersonalTodoReadDto> CreatePersonalTodoAsync(PersonalTodoCreateDto createDto, string userId);
        Task<PersonalTodoReadDto> UpdatePersonalTodoAsync(int id, PersonalTodoUpdateDto updateDto, string userId);
        Task<bool> DeletePersonalTodoAsync(int id, string userId);
        Task<PersonalTodoReadDto> StartTodoAsync(int id, string userId);
        Task<PersonalTodoReadDto> CompleteTodoAsync(int id, string userId);
        Task<PersonalTodoReadDto> UpdateProgressAsync(int id, int progress, string userId);
        Task MarkReminderSentAsync(int id);
        Task UpdateOverdueStatusAsync();
        Task<PersonalTodoReadDto> CreateNextRecurringTodoAsync(int completedTodoId);
        Task<IEnumerable<PersonalTodo>> GetTodosNeedingRemindersAsync();
        Task<IEnumerable<PersonalTodo>> GetTodosNeedingRemindersByTypeAsync(string userId, string notificationType);
        Task UpdateNotificationPreferencesAsync(int todoId, string userId, bool? enableEmail = null, bool? enablePush = null, bool? enableSms = null);
    }
}