using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Migrations;

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public class MilestoneTaskValidator : IMilestoneTaskValidator
    {
        private readonly AppDbContext _context;

        public MilestoneTaskValidator(AppDbContext context)
        {
            _context = context;
        }

        public async Task ValidateTaskDatesAgainstMilestone(int? milestoneId, DateTime? taskStartDate, DateTime? taskDueDate)
        {
            if (!milestoneId.HasValue) return;

            var milestone = await _context.Milestones
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId.Value);

            if (milestone == null)
                throw new InvalidOperationException("Invalid milestone ID");

            if (taskStartDate.HasValue && taskStartDate.Value < milestone.StartDate)
                throw new InvalidOperationException("Task cannot start before its milestone");

            if (taskDueDate.HasValue && taskDueDate.Value > milestone.DueDate)
                throw new InvalidOperationException("Task cannot end after its milestone");
        }

        public async Task ValidateMilestoneProjectConsistency(int? milestoneId, int projectAssignmentId)
        {
            if (!milestoneId.HasValue) return;

            var milestone = await _context.Milestones
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId.Value);

            if (milestone == null) return;

            var assignment = await _context.ProjectAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentId);

            if (assignment?.ProjectId != milestone.ProjectId)
                throw new InvalidOperationException("Milestone and task must belong to same project");
        }

        public async Task ValidateTaskCompletionAgainstMilestone(int taskId)
        {
            var task = await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task?.MilestoneId == null) return;

            var milestone = await _context.Milestones
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MilestoneId == task.MilestoneId);

            if (milestone?.Status != Model.Entities.Milestone.MilestoneStatus.Completed)
                throw new InvalidOperationException("Cannot complete task before milestone is completed");
        }
    }
}
