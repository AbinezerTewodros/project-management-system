namespace ProjectManagementSystem1.Services.MilestoneService
{
    public interface IMilestoneTaskValidator
    {
        Task ValidateTaskDatesAgainstMilestone(int? milestoneId, DateTime? taskStartDate, DateTime? taskDueDate);
        Task ValidateMilestoneProjectConsistency(int? milestoneId, int projectAssignmentId);
        Task ValidateTaskCompletionAgainstMilestone(int taskId);

    }
}
