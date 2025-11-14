using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Dto.IndependentTaskDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AttachmentService;
using ProjectManagementSystem1.Services.CommentService;
using ProjectManagementSystem1.Services.NotificationService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public class IndependentTaskService : IIndependentTaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IActivityLogService _activityLogService;
        private readonly ICommentService _commentService;
        private readonly IAttachmentService _attachmentService;

        public IndependentTaskService(
            AppDbContext context,
            INotificationService notificationService,
            IActivityLogService activityLogService,
            ICommentService commentService,
            IAttachmentService attachmentService)
        {
            _context = context;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
            _commentService = commentService;
            _attachmentService = attachmentService;
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
                .Where(t => t.AssignedToUserId == userId || t.CreatedByUserId == userId)
                .Include(it => it.AssignedToUser)
                .Include(it => it.CreatedByUser)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<IndependentTask>> GetTasksCreatedByUserAsync(string userId)
        {
            return await _context.IndependentTasks
                .Where(t => t.CreatedByUserId == userId)
                .Include(it => it.AssignedToUser)
                .Include(it => it.CreatedByUser)
                .OrderByDescending(t => t.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IndependentTask> CreateIndependentTaskAsync(IndependentTaskCreateDto createDto, string creatorId)
        {
            var task = new IndependentTask
            {
                Title = createDto.Title,
                Description = createDto.Description,
                DueDate = createDto.DueDate,
                Weight = createDto.Weight,
                Priority = createDto.Priority, // Add Priority property
                Progress = createDto.Progress, // Add Progress property
                CreatedByUserId = creatorId,
                AssignedToUserId = createDto.AssignedToUserId,
                Status = createDto.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.IndependentTasks.Add(task);
            _context.Database.SetCommandTimeout(120);
            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                creatorId,
                "IndependentTask",
                task.TaskId,
                "Created",
                $"Created new independent task: {task.Title}"
            );

            if (!string.IsNullOrEmpty(task.AssignedToUserId))
            {
                await _notificationService.SendNotificationAsync(
                    task.AssignedToUserId,
                    "New Task Assignment",
                    $"You have been assigned to task: '{task.Title}'",
                    "TaskAssigned",
                    "IndependentTask",
                    task.TaskId
                );
            }

            return task;
        }

        public async Task<IndependentTask> UpdateIndependentTaskAsync(int id, IndependentTaskUpdateDto updateDto, string userId)
        {
            var task = await _context.IndependentTasks.FindAsync(id);
            if (task == null)
                throw new NotFoundException("Task not found");

            if (task.CreatedByUserId != userId)
                throw new UnauthorizedAccessException("Only task creator can update task details");

            if (updateDto.Title != null)
                task.Title = updateDto.Title;

            if (updateDto.Description != null)
                task.Description = updateDto.Description;

            if (updateDto.DueDate.HasValue)
                task.DueDate = updateDto.DueDate.Value;

            if (updateDto.Weight.HasValue)
                task.Weight = updateDto.Weight.Value;

            if (updateDto.AssignedToUserId != null && task.AssignedToUserId != updateDto.AssignedToUserId)
            {
                var oldAssignee = task.AssignedToUserId;
                task.AssignedToUserId = updateDto.AssignedToUserId;
                task.Status = IndependentTaskStatus.Pending; // Reset status when assignee changes

                await _notificationService.SendNotificationAsync(
                    task.AssignedToUserId,
                    "New Task Assignment",
                    $"You have been assigned to task: '{task.Title}'",
                    "TaskAssigned",
                    "IndependentTask",
                    task.TaskId
                );

                if (!string.IsNullOrEmpty(oldAssignee))
                {
                    await _notificationService.SendNotificationAsync(
                        oldAssignee,
                        "Task Unassigned",
                        $"You have been unassigned from task: '{task.Title}'",
                        "TaskUnassigned",
                        "IndependentTask",
                        task.TaskId
                    );
                }
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                userId,
                "IndependentTask",
                task.TaskId,
                "Updated",
                $"Updated task details"
            );

            return task;
        }

        public async Task AcceptTaskAssignmentAsync(int taskId, string userId)
        {
            var task = await _context.IndependentTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.AssignedToUserId != userId)
                throw new UnauthorizedAccessException("You are not assigned to this task");

            if (task.Status != IndependentTaskStatus.Pending && task.Status != IndependentTaskStatus.Rejected)
                throw new InvalidOperationException($"Cannot accept task in current status: {task.Status}");

            var oldStatus = task.Status;
            task.Status = IndependentTaskStatus.Accepted;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var statusHistory = new TaskStatusHistory
            {
                TaskId = task.TaskId,
                OldStatus = oldStatus,
                NewStatus = IndependentTaskStatus.Accepted,
                ChangedAt = DateTime.UtcNow,
                ChangedById = userId,
                ChangeReason = "Task assignment accepted by user"
            };
            _context.TaskStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                userId,
                "IndependentTask",
                task.TaskId,
                "Accepted",
                $"Accepted task assignment"
            );

            await _notificationService.SendNotificationAsync(
                userId: task.CreatedByUserId,
                title: "Task Accepted",
                message: $"Task '{task.Title}' has been accepted by {userId}",
                type: "TaskAccepted",
                entityType: "IndependentTask",
                entityId: task.TaskId
            );
        }

        public async Task RejectTaskAssignmentAsync(int taskId, string userId, string reason)
        {
            var task = await _context.IndependentTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.AssignedToUserId != userId)
                throw new UnauthorizedAccessException("You are not assigned to this task");

            if (task.Status != IndependentTaskStatus.Pending && task.Status != IndependentTaskStatus.Accepted)
                throw new InvalidOperationException($"Cannot reject task in current status: {task.Status}");

            var oldStatus = task.Status;
            task.Status = IndependentTaskStatus.Rejected;
            task.RejectionReason = reason;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var statusHistory = new TaskStatusHistory
            {
                TaskId = task.TaskId,
                OldStatus = oldStatus,
                NewStatus = IndependentTaskStatus.Rejected,
                ChangedAt = DateTime.UtcNow,
                ChangedById = userId,
                ChangeReason = $"Task assignment rejected. Reason: {reason}"
            };
            _context.TaskStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                userId,
                "IndependentTask",
                task.TaskId,
                "Rejected",
                $"Rejected task assignment. Reason: {reason}"
            );

            await _notificationService.SendNotificationAsync(
                userId: task.CreatedByUserId,
                title: "Task Rejected",
                message: $"Task '{task.Title}' has been rejected by {userId}. Reason: {reason}",
                type: "TaskRejected",
                entityType: "IndependentTask",
                entityId: task.TaskId
            );
        }

        public async Task UpdateTaskProgressAsync(int taskId, string userId, int progress, string comments)
        {
            if (progress < 0 || progress > 100)
                throw new ArgumentOutOfRangeException(nameof(progress), "Progress must be between 0-100");

            var task = await _context.IndependentTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);
                
            if (task == null) 
                throw new NotFoundException("Task not found");

            // Check authorization: Assigned member, task creator, or managers/team leads can update progress
            var isAssignedMember = task.AssignedToUserId == userId;
            var isTaskCreator = task.CreatedByUserId == userId;
            var isAuthorized = isAssignedMember || isTaskCreator;

            if (!isAuthorized)
            {
                // For now, we'll use a simpler approach - you can enhance this later with proper role checking
                // Check if user is in the Users table and has specific roles
                // This is a simplified version - you might want to implement proper role checking through Identity
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null)
                {
                    // You can add role checking logic here later
                    // For now, we'll allow task creators and assigned members only
                }
            }

            if (!isAuthorized)
                throw new UnauthorizedAccessException("You are not authorized to update progress on this task. Only assigned members, task creators, and managers/team leads can update progress.");

            if (task.Status != IndependentTaskStatus.Accepted && task.Status != IndependentTaskStatus.InProgress && task.Status != IndependentTaskStatus.Reopened)
                throw new InvalidOperationException($"Cannot update progress in current status: {task.Status}. Task must be Accepted, InProgress, or Reopened.");

            if (task.Status == IndependentTaskStatus.Accepted && progress > 0)
            {
                task.Status = IndependentTaskStatus.InProgress;
                task.StartDate = DateTime.UtcNow;
            }

            task.Progress = progress;
            task.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(comments))
            {
                try
                {
                    await _commentService.AddCommentAsync(taskId, userId, comments);
                }
                catch (Exception ex)
                {
                    // Log the comment service error but don't fail the progress update
                    // You might want to add proper logging here
                }
            }

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                userId,
                "IndependentTask",
                task.TaskId,
                "ProgressUpdate",
                $"Updated progress to {progress}%"
            );
        }

        public async Task CompleteTaskAsync(int taskId, string userId, string completionDetails)
        {
            var task = await _context.IndependentTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.AssignedToUserId != userId)
                throw new UnauthorizedAccessException("You are not assigned to this task");

            if (task.Status != IndependentTaskStatus.InProgress && task.Status != IndependentTaskStatus.Reopened)
                throw new InvalidOperationException($"Cannot complete task in current status: {task.Status}");

            var oldStatus = task.Status;
            task.Status = IndependentTaskStatus.WaitingReview;
            task.Progress = 100;
            task.CompletionDetails = completionDetails;
            task.CompletedDate = DateTime.UtcNow;

            if (task.DueDate < DateTime.UtcNow)
            {
                task.LateCompletionReason = "Completed after due date";
            }

            // Create status history entry
            var statusHistory = new TaskStatusHistory
            {
                TaskId = task.TaskId,
                OldStatus = oldStatus,
                NewStatus = IndependentTaskStatus.WaitingReview,
                ChangedAt = DateTime.UtcNow,
                ChangedById = userId,
                ChangeReason = $"Task completed. Details: {completionDetails}"
            };
            _context.TaskStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                userId,
                "IndependentTask",
                task.TaskId,
                "Completed",
                $"Marked task as completed"
            );

            await _notificationService.SendNotificationAsync(
                task.CreatedByUserId,
                "Task Completion Submitted",
                $"Task '{task.Title}' has been marked as completed by {userId}",
                "TaskCompleted",
                "IndependentTask",
                task.TaskId
            );
        }

        public async Task ApproveTaskCompletionAsync(int taskId, string approverId, string comments)
        {
            var task = await _context.IndependentTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.CreatedByUserId != approverId)
                throw new UnauthorizedAccessException("Only task creator can approve completion");

            if (task.Status != IndependentTaskStatus.WaitingReview)
                throw new InvalidOperationException($"Cannot approve task in current status: {task.Status}");

            var oldStatus = task.Status;
            task.Status = IndependentTaskStatus.Approved;
            task.ApprovalComments = comments;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var statusHistory = new TaskStatusHistory
            {
                TaskId = task.TaskId,
                OldStatus = oldStatus,
                NewStatus = IndependentTaskStatus.Approved,
                ChangedAt = DateTime.UtcNow,
                ChangedById = approverId,
                ChangeReason = $"Task completion approved. Comments: {comments}"
            };
            _context.TaskStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                approverId,
                "IndependentTask",
                task.TaskId,
                "Approved",
                $"Approved task completion"
            );

            await _notificationService.SendNotificationAsync(
                task.AssignedToUserId,
                "Task Approved",
                $"Your completion of task '{task.Title}' has been approved",
                "TaskApproved",
                "IndependentTask",
                task.TaskId
            );
        }

        public async Task RejectTaskCompletionAsync(int taskId, string rejectorId, string reason)
        {
            var task = await _context.IndependentTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.CreatedByUserId != rejectorId)
                throw new UnauthorizedAccessException("Only task creator can reject completion");

            if (task.Status != IndependentTaskStatus.WaitingReview)
                throw new InvalidOperationException($"Cannot reject task in current status: {task.Status}");

            var oldStatus = task.Status;
            task.Status = IndependentTaskStatus.Reopened;
            task.ReopenReason = reason;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var statusHistory = new TaskStatusHistory
            {
                TaskId = task.TaskId,
                OldStatus = oldStatus,
                NewStatus = IndependentTaskStatus.Reopened,
                ChangedAt = DateTime.UtcNow,
                ChangedById = rejectorId,
                ChangeReason = $"Task completion rejected. Reason: {reason}"
            };
            _context.TaskStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            await _activityLogService.LogActivityAsync(
                rejectorId,
                "IndependentTask",
                task.TaskId,
                "RejectedCompletion",
                $"Rejected task completion. Reason: {reason}"
            );

            await _notificationService.SendNotificationAsync(
                task.AssignedToUserId,
                "Completion Rejected",
                $"Your completion of task '{task.Title}' was rejected. Reason: {reason}",
                "TaskRejected",
                "IndependentTask",
                task.TaskId
            );
        }

        //public async Task<Attachment> AddAttachmentAsync(int taskId, IFormFile file, string uploadedByUserId, string category = null)
        //{
        //    var uploadDto = new AttachmentUploadDto
        //    {
        //        File = file,
        //        EntityType = "IndependentTask",
        //        EntityId = taskId.ToString(),
        //        Category = AttachmentCategory.Task,
        //        AccessibilityLevel = AccessibilityLevel.Protected
        //    };

        //    return await _attachmentService.UploadAttachmentAsync(
        //        uploadDto,
        //        new EntityContext { EntityType = "IndependentTask", EntityId = taskId.ToString() },
        //        uploadedByUserId
        //    );
        //}

        public async Task<IEnumerable<Attachment>> GetAttachmentsAsync(int taskId)
        {
            return await _attachmentService.GetAttachmentByEntityAsync("IndependentTask", taskId.ToString());
        }

        public async Task<IEnumerable<Comment>> GetCommentsAsync(int taskId)
        {
            try
            {
                return await _commentService.GetCommentsByTaskIdAsync(taskId);
            }
            catch (Exception ex)
            {
                // Log the error but return empty collection instead of failing
                // You might want to add proper logging here
                return new List<Comment>();
            }
        }

        public async Task<Comment> AddCommentAsync(int taskId, string userId, string content)
        {
            try
            {
                await _commentService.AddCommentAsync(taskId, userId, content);
                return (await _commentService.GetCommentsByTaskIdAsync(taskId))
                    .FirstOrDefault(c => c.MemberId == userId && c.Content == content);
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the operation
                // You might want to add proper logging here
                throw new InvalidOperationException($"Failed to add comment: {ex.Message}");
            }
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