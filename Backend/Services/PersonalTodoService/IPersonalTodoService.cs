using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IPersonalTodoService
    {
        Task<PersonalTodo> GetPersonalTodoByIdAsync(int id);
        Task<IEnumerable<PersonalTodo>> GetAllPersonalTodosAsync();
        Task<IEnumerable<PersonalTodo>> GetPersonalTodosByUserAsync(string userId);
        Task<PersonalTodo> CreatePersonalTodoAsync(PersonalTodo todo);
        Task<PersonalTodo> UpdatePersonalTodoAsync(int id, PersonalTodo todo);
        Task<bool> DeletePersonalTodoAsync(int id);
    }
}