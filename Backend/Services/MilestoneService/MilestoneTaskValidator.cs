using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;

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

            // Get the milestone with its project
            var milestone = await _context.Milestones
                .Include(m => m.Project)
                .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId.Value);

            if (milestone == null)
                throw new InvalidOperationException($"Milestone with ID {milestoneId} not found");

            // Get the project assignment
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentId);

            if (assignment == null)
                throw new InvalidOperationException($"Project assignment with ID {projectAssignmentId} not found");

            // ✅ CORRECT VALIDATION: Compare milestone's project with assignment's project
            if (milestone.ProjectId != assignment.ProjectId)
            {
                throw new InvalidOperationException(
                    $"Milestone '{milestone.MilestoneName}' (Project: {milestone.ProjectId}) " +
                    $"and project assignment (Project: {assignment.ProjectId}) must belong to the same project.");
            }
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

            if (milestone?.Status != MilestoneStatus.Completed)
                throw new InvalidOperationException("Cannot complete task before milestone is completed");
        }
    }
}
