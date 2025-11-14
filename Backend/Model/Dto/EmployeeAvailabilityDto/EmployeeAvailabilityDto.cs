namespace ProjectManagementSystem1.Model.Dto.EmployeeAvailabilityDto
{
    public class EmployeeAvailabilityDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int TotalActiveProjects { get; set; }
        public int TotalActiveTasks { get; set; }
        public int TotalPendingTodos { get; set; }
        public double CurrentWorkloadPercentage { get; set; }
        public List<ProjectWorkloadDto> ProjectWorkloads { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public AvailabilityStatus Status { get; set; }
    }

    public class ProjectWorkloadDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public int TaskCount { get; set; }
        public int CompletedTasks { get; set; }
        public double ProgressPercentage { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public class EmployeeWorkloadDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public double WorkloadPercentage { get; set; }
        public int ActiveProjects { get; set; }
        public int PendingTasks { get; set; }
        public AvailabilityStatus Status { get; set; }
        public DateTime? NextAvailableDate { get; set; }
    }

    public class EmployeeCapacityDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public double AvailableCapacity { get; set; }
        public List<string> Skills { get; set; } = new();
        public int ExperienceLevel { get; set; }
        public DateTime AvailableFrom { get; set; }
    }

    public class WorkloadSummaryDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public double TotalWorkloadHours { get; set; }
        public double CompletedHours { get; set; }
        public double RemainingHours { get; set; }
        public int OverdueTasksCount { get; set; }
        public List<TaskWorkloadDto> TaskBreakdown { get; set; } = new();
    }

    public class TaskWorkloadDto
    {
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public double EstimatedHours { get; set; }
        public double ActualHours { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsOverdue { get; set; }
    }

    public enum AvailabilityStatus
    {
        Available,
        Busy,
        Overloaded,
        OnLeave,
        Unavailable
    }
}
