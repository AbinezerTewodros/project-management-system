//using ProjectManagementSystem1.Data;
//using ProjectManagementSystem1.Model.Entities;
//using System.ComponentModel.DataAnnotations;
//using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

//namespace ProjectManagementSystem1.Services
//{
//    public class ProjectTaskValidator
//    {
//        private readonly AppDbContext _context;

//        public ProjectTaskValidator(AppDbContext context)
//        {
//            _context = context;
//        }

//        public async Task ValidateAsync(ProjectTask task)
//        {
//            // 1. Rejection requires a reason
//            if (task.Status == TaskStatus.Rejected && string.IsNullOrWhiteSpace(task.RejectionReason))
//                throw new ValidationException("RejectionReason is required when status is Rejected.");

//            // 2. Cannot Accept or Reject without an assigned member
//            if ((task.Status == TaskStatus.Accepted || task.Status == TaskStatus.Rejected) &&
//                string.IsNullOrWhiteSpace(task.AssignedMemberId))
//                throw new ValidationException("Task must be assigned before it can be accepted or rejected.");

//            // 3. Parent-child project consistency
//            if (task.ParentTaskId.HasValue)
//            {
//                var parent = await _context.ProjectTasks.FindAsync(task.ParentTaskId.Value);
//                if (parent == null)
//                    throw new ValidationException("Parent task does not exist.");

//                if (parent.ProjectAssignmentId != task.ProjectAssignmentId)
//                    throw new ValidationException("Parent and child tasks must belong to the same ProjectAssignment.");
//            }

//            // 4. Due date vs priority alignment
//            if (task.DueDate.)
//            {
//                var daysUntilDue = (task.DueDate.Value - DateTime.UtcNow).TotalDays;

//                switch (task.Priority)
//                {
//                    case TaskPriority.Critical:
//                        if (daysUntilDue > 3)
//                            throw new ValidationException("Critical tasks must be due within 3 days.");
//                        break;
//                    case TaskPriority.High:
//                        if (daysUntilDue > 5)
//                            throw new ValidationException("High priority tasks must be due within 5 days.");
//                        break;
//                    case TaskPriority.Medium:
//                        if (daysUntilDue > 10)
//                            throw new ValidationException("Medium priority tasks must be due within 10 days.");
//                        break;
//                        // Low priority: no constraint
//                }
//            }
//        }
//    }

//}
