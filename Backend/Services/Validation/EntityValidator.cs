using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;

namespace ProjectManagementSystem1.Services.Validation
{
    public class EntityValidator : IEntityValidator
    {
        private readonly AppDbContext _context;
        public EntityValidator(AppDbContext context) => _context = context;

        public async Task<bool> ExistsAsync(string entityType, string entityId) =>
            entityType switch
            {
                "Project" => await _context.Projects.AnyAsync(p => p.Id.ToString() == entityId),
                "ProjectTask" => await _context.ProjectTasks.AnyAsync(t => t.Id.ToString() == entityId),
                "Milestone" => await _context.Milestones.AnyAsync(m => m.MilestoneId.ToString() == entityId),
                "TodoItem" => await _context.TodoItems.AnyAsync(t => t.Id.ToString() == entityId),
                "IndependentTask" => await _context.IndependentTasks.AnyAsync(i => i.TaskId.ToString() == entityId),
                "PersonalTodo" => await _context.PersonalTodo.AnyAsync(p => p.TodoId.ToString() == entityId),
                _ => false
            };
    }
}
