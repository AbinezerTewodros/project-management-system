using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Reports
{
    public class ReportRequestDto
    {
        public ReportType ReportType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<int>? ProjectIds { get; set; }
        public List<string>? UserIds { get; set; }
        public string? Department { get; set; }
        public bool IncludeArchived { get; set; } = false;
        public ReportFormat Format { get; set; } = ReportFormat.Json;
    }

    public class ReportResponseDto<T>
    {
        public string ReportTitle { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string GeneratedBy { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
        public T Data { get; set; } = default(T)!;
        public ReportSummaryDto Summary { get; set; } = new();
    }

    public class ReportSummaryDto
    {
        public int TotalRecords { get; set; }
        public Dictionary<string, object> KeyMetrics { get; set; } = new();
        public List<string> Notes { get; set; } = new();
    }

    // Project Summary Report
    public class ProjectSummaryReportDto
    {
        public List<ProjectSummaryItemDto> Projects { get; set; } = new();
        public ProjectOverviewDto Overview { get; set; } = new();
    }

    public class ProjectSummaryItemDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double ProgressPercentage { get; set; }
        public int TeamMembersCount { get; set; }
        public int IssuesCount { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysUntilDue { get; set; }
    }

    public class ProjectOverviewDto
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int OnHoldProjects { get; set; }
        public int OverdueProjects { get; set; }
        public double AverageProgress { get; set; }
        public int TotalTeamMembers { get; set; }
        public int TotalTasks { get; set; }
        public int TotalIssues { get; set; }
    }

    // Task Progress Report
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
        public string ProjectName { get; set; } = string.Empty;
        public string AssignedMemberName { get; set; } = string.Empty;
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

    // Team Performance Report
    public class TeamPerformanceReportDto
    {
        public List<TeamMemberPerformanceDto> TeamMembers { get; set; } = new();
        public TeamOverviewDto Overview { get; set; } = new();
        public List<DepartmentPerformanceDto> DepartmentPerformance { get; set; } = new();
    }

    public class TeamMemberPerformanceDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int AssignedProjects { get; set; }
        public int AssignedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double TaskCompletionRate { get; set; }
        public double AverageTaskProgress { get; set; }
        public double WorkloadPercentage { get; set; }
        public bool IsScrumMaster { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class TeamOverviewDto
    {
        public int TotalTeamMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int ScrumMasters { get; set; }
        public double AverageWorkload { get; set; }
        public double AverageCompletionRate { get; set; }
        public int TotalDepartments { get; set; }
    }

    public class DepartmentPerformanceDto
    {
        public string Department { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public int ProjectsCount { get; set; }
        public int TasksCount { get; set; }
        public double CompletionRate { get; set; }
        public double AverageWorkload { get; set; }
    }

    // Issue Summary Report
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
        public string ProjectName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
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

    // Enums
    public enum ReportType
    {
        ProjectSummary,
        TaskProgress,
        TeamPerformance,
        IssueSummary,
        DepartmentOverview,
        WorkloadAnalysis
    }

    public enum ReportFormat
    {
        Json,
        Csv,
        Excel,
        Pdf
    }
}
