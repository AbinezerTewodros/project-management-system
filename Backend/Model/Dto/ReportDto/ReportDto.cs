using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ReportDto
{
    public enum ReportType
    {
        ProjectSummary,
        TaskProgress,
        TeamPerformance,
        IssueSummary
    }

    public enum ReportFormat
    {
        Json,
        Csv,
        Excel,
        Pdf
    }

    public enum ScheduleType
    {
        OneTime,
        Recurring
    }

    public class ReportRequestDto
    {
        public ReportType ReportType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Department { get; set; }
        public List<int>? ProjectIds { get; set; }
        public List<string>? UserIds { get; set; }
        public ReportFormat ExportFormat { get; set; } = ReportFormat.Json;
    }

    public class ReportResponseDto<T>
    {
        public string ReportTitle { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public string GeneratedBy { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
        public T Data { get; set; } = default!;
        public ReportSummaryDto Summary { get; set; } = new();
    }

    public class ReportSummaryDto
    {
        public int TotalRecords { get; set; }
        public Dictionary<string, object> KeyMetrics { get; set; } = new();
    }

    public class ScheduledReportDto
    {
        public string JobId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public ScheduleType ScheduleType { get; set; }
        public string CronExpression { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
        public ReportFormat ExportFormat { get; set; }
        public List<string> Recipients { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class ScheduledReportExecutionDto
    {
        public string ExecutionId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public ReportFormat ExportFormat { get; set; }
        public DateTime ExecutedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }

    // Report-specific DTOs
    public class ProjectSummaryReportDto
    {
        public List<ProjectSummaryItemDto> Projects { get; set; } = new();
        public ProjectOverviewDto Overview { get; set; } = new();
        public List<ProjectsByStatusDto> ProjectsByStatus { get; set; } = new();
        public List<ProjectsByDepartmentDto> ProjectsByDepartment { get; set; } = new();
    }

    public class ProjectSummaryItemDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public double Progress { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsOverdue { get; set; }
    }

    public class ProjectOverviewDto
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int OverdueProjects { get; set; }
        public double AverageProgress { get; set; }
    }

    public class ProjectsByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class ProjectsByDepartmentDto
    {
        public string Department { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class TaskProgressReportDto
    {
        public List<TaskProgressItemDto> Tasks { get; set; } = new();
        public TaskOverviewDto Overview { get; set; } = new();
        public List<TasksByStatusDto> TasksByStatus { get; set; } = new();
        public List<TasksByPriorityDto> TasksByPriority { get; set; } = new();
    }

    public class TaskProgressItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int Progress { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysUntilDue { get; set; }
        public int CommentsCount { get; set; }
    }

    public class TaskOverviewDto
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double AverageProgress { get; set; }
        public double CompletionRate { get; set; }
    }

    public class TasksByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class TasksByPriorityDto
    {
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class TeamPerformanceReportDto
    {
        public List<TeamMemberPerformanceDto> TeamMembers { get; set; } = new();
        public TeamOverviewDto Overview { get; set; } = new();
        public List<PerformanceByDepartmentDto> PerformanceByDepartment { get; set; } = new();
    }

    public class TeamMemberPerformanceDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int AssignedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public double CompletionRate { get; set; }
        public double AverageTaskDuration { get; set; }
        public int OverdueTasks { get; set; }
    }

    public class TeamOverviewDto
    {
        public int TotalTeamMembers { get; set; }
        public double AverageCompletionRate { get; set; }
        public double AverageTaskDuration { get; set; }
        public int TotalOverdueTasks { get; set; }
    }

    public class PerformanceByDepartmentDto
    {
        public string Department { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public double AverageCompletionRate { get; set; }
        public double AverageTaskDuration { get; set; }
    }

    public class IssueSummaryReportDto
    {
        public List<IssueSummaryItemDto> Issues { get; set; } = new();
        public IssueOverviewDto Overview { get; set; } = new();
        public List<IssuesByTypeDto> IssuesByType { get; set; } = new();
        public List<IssuesByStatusDto> IssuesByStatus { get; set; } = new();
    }

    public class IssueSummaryItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public string? AssigneeName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public int DaysToResolve { get; set; }
        public bool IsOverdue { get; set; }
    }

    public class IssueOverviewDto
    {
        public int TotalIssues { get; set; }
        public int OpenIssues { get; set; }
        public int ResolvedIssues { get; set; }
        public int ClosedIssues { get; set; }
        public double ResolutionRate { get; set; }
        public double AverageResolutionTime { get; set; }
    }

    public class IssuesByTypeDto
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class IssuesByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}
