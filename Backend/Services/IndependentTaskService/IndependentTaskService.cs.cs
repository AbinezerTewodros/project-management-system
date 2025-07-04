using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System;
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
            return await _context.IndependentTasks.FindAsync(id);
        }

        public async Task<IEnumerable<IndependentTask>> GetAllIndependentTasksAsync()
        {
            return await _context.IndependentTasks.ToListAsync();
        }

        public async Task<IEnumerable<IndependentTask>> GetIndependentTasksByUserAsync(string userId)
        {
            return await _context.IndependentTasks.Where(t => t.AssignedToUserId == userId).ToListAsync();
        }

        public async Task<IndependentTask> CreateIndependentTaskAsync(IndependentTask task)
        {
            _context.IndependentTasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<IndependentTask> UpdateIndependentTaskAsync(int id, IndependentTask task)
        {
            var existingTask = await _context.IndependentTasks.FindAsync(id);
            if (existingTask == null)
            {
                return null; // Or throw a NotFoundException
            }

            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.AssignedToUserId = task.AssignedToUserId;
            existingTask.DueDate = task.DueDate;
            existingTask.Status = task.Status;
            existingTask.CreatedByUserId = task.CreatedByUserId;
            existingTask.UpdatedAt = DateTime.UtcNow;
            existingTask.Progress = task.Progress;

            await _context.SaveChangesAsync();
            return existingTask;
        }

        public async Task<bool> DeleteIndependentTaskAsync(int id)
        {
            var taskToDelete = await _context.IndependentTasks.FindAsync(id);
            if (taskToDelete == null)
            {
                return false;
            }

            _context.IndependentTasks.Remove(taskToDelete);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}