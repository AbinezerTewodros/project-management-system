using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{

    public class IndependentTaskService : IIndependentTaskService
    {
        private readonly AppDbContext _context;

        public IndependentTaskService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IndependentTask> GetIndependentTaskByIdAsync(int id)
        {
            return await _context.IndependentTasks
                .Include(it => it.AssignedToUser)
                .Include(it => it.CreatedByUser)
                .FirstOrDefaultAsync(it => it.TaskId == id);
        }

        public async Task<IEnumerable<IndependentTask>> GetAllIndependentTasksAsync()
        {
            return await _context.IndependentTasks
                .Include(it => it.AssignedToUser)
                .Include(it => it.CreatedByUser)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<IndependentTask>> GetIndependentTasksByUserAsync(string userId)
        {
            return await _context.IndependentTasks
                .Where(t => t.AssignedToUserId == userId)
                .Include(it => it.AssignedToUser)
                .Include(it => it.CreatedByUser)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IndependentTask> CreateIndependentTaskAsync(IndependentTask task)
        {
            task.CreatedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;

            _context.IndependentTasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<IndependentTask> UpdateIndependentTaskAsync(int id, IndependentTask task)
        {
            var existingTask = await _context.IndependentTasks.FindAsync(id);
            if (existingTask == null) return null;

            // Update only allowed fields
            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.DueDate = task.DueDate;
            existingTask.Weight = task.Weight;
            existingTask.Progress = task.Progress;
            existingTask.Status = task.Status;
            existingTask.AssignedToUserId = task.AssignedToUserId;
            existingTask.UpdatedAt = DateTime.UtcNow;

            // Validate status
            if (!IndependentTask.AllowedStatuses.Contains(existingTask.Status))
            {
                throw new InvalidOperationException("Invalid task status");
            }

            // Auto-complete if progress is 100%
            if (existingTask.Progress >= 100 && existingTask.Status != "Completed")
            {
                existingTask.Status = "Completed";
            }

            await _context.SaveChangesAsync();
            return existingTask;
        }

        public async Task<bool> DeleteIndependentTaskAsync(int id)
        {
            var task = await _context.IndependentTasks.FindAsync(id);
            if (task == null) return false;

            _context.IndependentTasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }


    }
}