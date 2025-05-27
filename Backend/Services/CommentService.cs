using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public class CommentService : ICommentService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notification;
        public CommentService(AppDbContext context, INotificationService notification)
        {
            _context = context;
            _notification = notification;
        }

        public async Task AddCommentAsync(int taskId, string memberId, string content)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);

            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            var comment = new Comment
            {
                TaskId = taskId,
                MemberId = memberId,
                Content = content
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Notify the assigned member of the task (if they are not the one who commented)
            if (task.AssignedMemberId != memberId && !string.IsNullOrEmpty(task.AssignedMemberId))
            {
                await _notification.CreateNotificationAsync(
                    userId: task.AssignedMemberId,
                    message: $"A new comment has been added to task '{task.Title}'.",
                    relatedEntityType: "ProjectTask",
                    relatedEntityId: taskId
                );
            }
        }

        public async Task<List<Comment>> GetCommentsByTaskIdAsync(int taskId)
        {
            return await _context.Comments
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }
    }
}
