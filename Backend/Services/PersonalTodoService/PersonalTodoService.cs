using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public class PersonalTodoService : IPersonalTodoService
    {
        private readonly AppDbContext _context;

        public PersonalTodoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PersonalTodo> GetPersonalTodoByIdAsync(int id)
        {
            return await _context.PersonalTodo.FindAsync(id);
        }

        public async Task<IEnumerable<PersonalTodo>> GetAllPersonalTodosAsync()
        {
            return await _context.PersonalTodo.ToListAsync();
        }

        public async Task<IEnumerable<PersonalTodo>> GetPersonalTodosByUserAsync(string userId)
        {
            return await _context.PersonalTodo.Where(t => t.UserId == userId).ToListAsync();
        }

        public async Task<PersonalTodo> CreatePersonalTodoAsync(PersonalTodo todo)
        {
            _context.PersonalTodo.Add(todo);
            await _context.SaveChangesAsync();
            return todo;
        }

        public async Task<PersonalTodo> UpdatePersonalTodoAsync(int id, PersonalTodo todo)
        {
            var existingTodo = await _context.PersonalTodo.FindAsync(id);
            if (existingTodo == null)
            {
                return null; // Or throw a NotFoundException
            }

            existingTodo.Task = todo.Task;
            existingTodo.IsCompleted = todo.IsCompleted;
            existingTodo.UpdatedAt = DateTime.UtcNow;
            existingTodo.Progress = todo.Progress;

            await _context.SaveChangesAsync();
            return existingTodo;
        }

        public async Task<bool> DeletePersonalTodoAsync(int id)
        {
            var todoToDelete = await _context.PersonalTodo.FindAsync(id);
            if (todoToDelete == null)
            {
                return false;
            }

            _context.PersonalTodo.Remove(todoToDelete);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}