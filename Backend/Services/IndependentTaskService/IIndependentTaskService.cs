using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IIndependentTaskService
    {
        Task<IndependentTask> GetIndependentTaskByIdAsync(int id);
        Task<IEnumerable<IndependentTask>> GetAllIndependentTasksAsync();
        Task<IEnumerable<IndependentTask>> GetIndependentTasksByUserAsync(string userId);
        Task<IndependentTask> CreateIndependentTaskAsync(IndependentTask task);
        Task<IndependentTask> UpdateIndependentTaskAsync(int id, IndependentTask task);
        Task<bool> DeleteIndependentTaskAsync(int id);
    }
}