using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Reports;
using ProjectManagementSystem1.Model.Entities;
using System.Text.Json;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;
using IssueStatus = ProjectManagementSystem1.Model.Entities.IssueStatus;

namespace ProjectManagementSystem1.Services.ReportService
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ReportService> _logger;

        public ReportService(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ReportService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<ReportResponseDto<ProjectSummaryReportDto>> GenerateProjectSummaryReportAsync(ReportRequestDto request, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) throw new UnauthorizedAccessException("User not found");

                var projectsQuery = _context.Projects
                    .Include(p => p.ProjectAssignments)
                    .Include(p => p.Issues)
                    .AsQueryable();

                // Apply filters
                if (request.StartDate.HasValue)
                    projectsQuery = projectsQuery.Where(p => p.CreatedDate >= request.StartDate.Value);

                if (request.EndDate.HasValue)
                    projectsQuery = projectsQuery.Where(p => p.CreatedDate <= request.EndDate.Value);

                if (request.ProjectIds?.Any() == true)
                    projectsQuery = projectsQuery.Where(p => request.ProjectIds.Contains(p.Id));

                if (!string.IsNullOrEmpty(request.Department))
                    projectsQuery = projectsQuery.Where(p => p.Department == request.Department);

                if (!request.IncludeArchived)
                    projectsQuery = projectsQuery.Where(p => !p.IsArchived);

                var projects = await projectsQuery.ToListAsync();

                var reportData = new ProjectSummaryReportDto
                {
                    Projects = new List<ProjectSummaryItemDto>(),
                    Overview = new ProjectOverviewDto()
                };

                foreach (var project in projects)
                {
                    var tasks = await _context.ProjectTasks
                        .Where(t => t.ProjectAssignment.ProjectId == project.Id)
                        .ToListAsync();

                    var projectItem = new ProjectSummaryItemDto
                    {
                        Id = project.Id,
                        ProjectName = project.ProjectName,
                        Department = project.Department,
                        Status = project.Status,
                        Priority = project.Priority,
                        DueDate = project.DueDate,
                        TotalTasks = tasks.Count,
                        CompletedTasks = tasks.Count(t => t.Status == TaskStatus.Completed),
                        PendingTasks = tasks.Count(t => t.Status == TaskStatus.Pending || t.Status == TaskStatus.InProgress),
                        OverdueTasks = tasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != TaskStatus.Completed),
                        ProgressPercentage = tasks.Any() ? (double)tasks.Count(t => t.Status == TaskStatus.Completed) / tasks.Count * 100 : 0,
                        TeamMembersCount = project.ProjectAssignments.Count,
                        IssuesCount = project.Issues.Count,
                        IsOverdue = project.DueDate < DateTime.UtcNow && project.Status != "Completed",
                        DaysUntilDue = project.DueDate.HasValue ? (int)((project.DueDate.Value - DateTime.UtcNow).TotalDays) : 0
                    };

                    reportData.Projects.Add(projectItem);
                }

                // Calculate overview
                reportData.Overview = new ProjectOverviewDto
                {
                    TotalProjects = projects.Count,
                    ActiveProjects = projects.Count(p => p.Status == "Active"),
                    CompletedProjects = projects.Count(p => p.Status == "Completed"),
                    OnHoldProjects = projects.Count(p => p.Status == "On Hold"),
                    OverdueProjects = reportData.Projects.Count(p => p.IsOverdue),
                    AverageProgress = reportData.Projects.Any() ? reportData.Projects.Average(p => p.ProgressPercentage) : 0,
                    TotalTeamMembers = reportData.Projects.Sum(p => p.TeamMembersCount),
                    TotalTasks = reportData.Projects.Sum(p => p.TotalTasks),
                    TotalIssues = reportData.Projects.Sum(p => p.IssuesCount)
                };

                return new ReportResponseDto<ProjectSummaryReportDto>
                {
                    ReportTitle = "Project Summary Report",
                    GeneratedAt = DateTime.UtcNow,
                    GeneratedBy = user.UserName ?? string.Empty,
                    ReportType = ReportType.ProjectSummary,
                    PeriodStart = request.StartDate,
                    PeriodEnd = request.EndDate,
                    Data = reportData,
                    Summary = new ReportSummaryDto
                    {
                        TotalRecords = projects.Count,
                        KeyMetrics = new Dictionary<string, object>
                        {
                            ["TotalProjects"] = reportData.Overview.TotalProjects,
                            ["ActiveProjects"] = reportData.Overview.ActiveProjects,
                            ["AverageProgress"] = Math.Round(reportData.Overview.AverageProgress, 2),
                            ["OverdueProjects"] = reportData.Overview.OverdueProjects
                        }
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating project summary report for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ReportResponseDto<TaskProgressReportDto>> GenerateTaskProgressReportAsync(ReportRequestDto request, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) throw new UnauthorizedAccessException("User not found");

                var tasksQuery = _context.ProjectTasks
                    .Include(t => t.ProjectAssignment)
                        .ThenInclude(pa => pa.Project)
                    .Include(t => t.ProjectAssignment)
                        .ThenInclude(pa => pa.Member)
                    .AsQueryable();

                // Apply filters
                if (request.StartDate.HasValue)
                    tasksQuery = tasksQuery.Where(t => t.CreatedAt >= request.StartDate.Value);

                if (request.EndDate.HasValue)
                    tasksQuery = tasksQuery.Where(t => t.CreatedAt <= request.EndDate.Value);

                if (request.ProjectIds?.Any() == true)
                    tasksQuery = tasksQuery.Where(t => request.ProjectIds.Contains(t.ProjectAssignment.ProjectId));

                if (request.UserIds?.Any() == true)
                    tasksQuery = tasksQuery.Where(t => request.UserIds.Contains(t.AssignedMemberId));

                var tasks = await tasksQuery.ToListAsync();

                var reportData = new TaskProgressReportDto
                {
                    Tasks = new List<TaskProgressItemDto>(),
                    Overview = new TaskOverviewDto(),
                    TasksByStatus = new List<TasksByStatusDto>(),
                    TasksByPriority = new List<TasksByPriorityDto>()
                };

                foreach (var task in tasks)
                {
                    var taskItem = new TaskProgressItemDto
                    {
                        Id = task.Id,
                        Title = task.Title,
                        ProjectName = task.ProjectAssignment.Project?.ProjectName ?? "Unknown",
                        AssignedMemberName = task.ProjectAssignment.Member?.UserName ?? "Unassigned",
                        Status = task.Status.ToString(),
                        Priority = task.Priority.ToString(),
                        Progress = (int)task.Progress,
                        DueDate = task.DueDate,
                        CreatedAt = task.CreatedAt,
                        UpdatedAt = task.UpdatedAt,
                        IsOverdue = task.DueDate < DateTime.UtcNow && task.Status != TaskStatus.Completed,
                        DaysUntilDue = task.DueDate.HasValue ? (int)((task.DueDate.Value - DateTime.UtcNow).TotalDays) : 0,
                        CommentsCount = 0 // TODO: Add comments count when comment system is implemented
                    };

                    reportData.Tasks.Add(taskItem);
                }

                // Calculate overview
                reportData.Overview = new TaskOverviewDto
                {
                    TotalTasks = tasks.Count,
                    CompletedTasks = tasks.Count(t => t.Status == TaskStatus.Completed),
                    InProgressTasks = tasks.Count(t => t.Status == TaskStatus.InProgress),
                    PendingTasks = tasks.Count(t => t.Status == TaskStatus.Pending),
                    OverdueTasks = reportData.Tasks.Count(t => t.IsOverdue),
                    AverageProgress = tasks.Any() ? tasks.Average(t => t.Progress) : 0,
                    CompletionRate = tasks.Any() ? (double)tasks.Count(t => t.Status == TaskStatus.Completed) / tasks.Count * 100 : 0
                };

                // Group by status
                var statusGroups = tasks.GroupBy(t => t.Status.ToString()).ToList();
                foreach (var group in statusGroups)
                {
                    reportData.TasksByStatus.Add(new TasksByStatusDto
                    {
                        Status = group.Key,
                        Count = group.Count(),
                        Percentage = tasks.Any() ? (double)group.Count() / tasks.Count * 100 : 0
                    });
                }

                // Group by priority
                var priorityGroups = tasks.GroupBy(t => t.Priority.ToString()).ToList();
                foreach (var group in priorityGroups)
                {
                    reportData.TasksByPriority.Add(new TasksByPriorityDto
                    {
                        Priority = group.Key,
                        Count = group.Count(),
                        Percentage = tasks.Any() ? (double)group.Count() / tasks.Count * 100 : 0
                    });
                }

                return new ReportResponseDto<TaskProgressReportDto>
                {
                    ReportTitle = "Task Progress Report",
                    GeneratedAt = DateTime.UtcNow,
                    GeneratedBy = user.UserName ?? string.Empty,
                    ReportType = ReportType.TaskProgress,
                    PeriodStart = request.StartDate,
                    PeriodEnd = request.EndDate,
                    Data = reportData,
                    Summary = new ReportSummaryDto
                    {
                        TotalRecords = tasks.Count,
                        KeyMetrics = new Dictionary<string, object>
                        {
                            ["TotalTasks"] = reportData.Overview.TotalTasks,
                            ["CompletionRate"] = Math.Round(reportData.Overview.CompletionRate, 2),
                            ["AverageProgress"] = Math.Round(reportData.Overview.AverageProgress, 2),
                            ["OverdueTasks"] = reportData.Overview.OverdueTasks
                        }
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating task progress report for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ReportResponseDto<TeamPerformanceReportDto>> GenerateTeamPerformanceReportAsync(ReportRequestDto request, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) throw new UnauthorizedAccessException("User not found");

                var assignmentsQuery = _context.ProjectAssignments
                    .Include(pa => pa.Member)
                    .Include(pa => pa.Project)
                    .Include(pa => pa.Tasks)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(request.Department))
                    assignmentsQuery = assignmentsQuery.Where(pa => pa.Project.Department == request.Department);

                if (request.ProjectIds?.Any() == true)
                    assignmentsQuery = assignmentsQuery.Where(pa => request.ProjectIds.Contains(pa.ProjectId));

                if (request.UserIds?.Any() == true)
                    assignmentsQuery = assignmentsQuery.Where(pa => request.UserIds.Contains(pa.MemberId));

                var assignments = await assignmentsQuery.ToListAsync();
                var memberGroups = assignments.GroupBy(a => a.MemberId).ToList();

                var reportData = new TeamPerformanceReportDto
                {
                    TeamMembers = new List<TeamMemberPerformanceDto>(),
                    Overview = new TeamOverviewDto(),
                    DepartmentPerformance = new List<DepartmentPerformanceDto>()
                };

                foreach (var memberGroup in memberGroups)
                {
                    var memberAssignments = memberGroup.ToList();
                    var member = memberAssignments.First().Member;
                    var allTasks = memberAssignments.SelectMany(a => a.Tasks).ToList();

                    var memberPerformance = new TeamMemberPerformanceDto
                    {
                        UserId = member.Id,
                        UserName = member.UserName ?? string.Empty,
                        FullName = member.FullName ?? string.Empty,
                        Department = member.Department ?? string.Empty,
                        AssignedProjects = memberAssignments.Count,
                        AssignedTasks = allTasks.Count,
                        CompletedTasks = allTasks.Count(t => t.Status == TaskStatus.Completed),
                        PendingTasks = allTasks.Count(t => t.Status != TaskStatus.Completed),
                        OverdueTasks = allTasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != TaskStatus.Completed),
                        TaskCompletionRate = allTasks.Any() ? (double)allTasks.Count(t => t.Status == TaskStatus.Completed) / allTasks.Count * 100 : 0,
                        AverageTaskProgress = allTasks.Any() ? allTasks.Average(t => t.Progress) : 0,
                        WorkloadPercentage = memberAssignments.Sum(a => a.WorkloadPercentage),
                        IsScrumMaster = memberAssignments.Any(a => a.Role == "Scrum Master"),
                        LastActivity = allTasks.Any() ? allTasks.Max(t => t.UpdatedAt ?? t.CreatedAt) : DateTime.MinValue
                    };

                    reportData.TeamMembers.Add(memberPerformance);
                }

                // Calculate overview
                reportData.Overview = new TeamOverviewDto
                {
                    TotalTeamMembers = memberGroups.Count,
                    ActiveMembers = reportData.TeamMembers.Count(m => m.AssignedTasks > 0),
                    ScrumMasters = reportData.TeamMembers.Count(m => m.IsScrumMaster),
                    AverageWorkload = reportData.TeamMembers.Any() ? reportData.TeamMembers.Average(m => m.WorkloadPercentage) : 0,
                    AverageCompletionRate = reportData.TeamMembers.Any() ? reportData.TeamMembers.Average(m => m.TaskCompletionRate) : 0,
                    TotalDepartments = reportData.TeamMembers.Select(m => m.Department).Distinct().Count()
                };

                // Group by department
                var departmentGroups = reportData.TeamMembers.GroupBy(m => m.Department).ToList();
                foreach (var deptGroup in departmentGroups)
                {
                    var deptMembers = deptGroup.ToList();
                    reportData.DepartmentPerformance.Add(new DepartmentPerformanceDto
                    {
                        Department = deptGroup.Key,
                        MembersCount = deptMembers.Count,
                        ProjectsCount = deptMembers.Sum(m => m.AssignedProjects),
                        TasksCount = deptMembers.Sum(m => m.AssignedTasks),
                        CompletionRate = deptMembers.Any() ? deptMembers.Average(m => m.TaskCompletionRate) : 0,
                        AverageWorkload = deptMembers.Any() ? deptMembers.Average(m => m.WorkloadPercentage) : 0
                    });
                }

                return new ReportResponseDto<TeamPerformanceReportDto>
                {
                    ReportTitle = "Team Performance Report",
                    GeneratedAt = DateTime.UtcNow,
                    GeneratedBy = user.UserName ?? string.Empty,
                    ReportType = ReportType.TeamPerformance,
                    PeriodStart = request.StartDate,
                    PeriodEnd = request.EndDate,
                    Data = reportData,
                    Summary = new ReportSummaryDto
                    {
                        TotalRecords = memberGroups.Count,
                        KeyMetrics = new Dictionary<string, object>
                        {
                            ["TotalTeamMembers"] = reportData.Overview.TotalTeamMembers,
                            ["AverageCompletionRate"] = Math.Round(reportData.Overview.AverageCompletionRate, 2),
                            ["AverageWorkload"] = Math.Round(reportData.Overview.AverageWorkload, 2),
                            ["ScrumMasters"] = reportData.Overview.ScrumMasters
                        }
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating team performance report for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ReportResponseDto<IssueSummaryReportDto>> GenerateIssueSummaryReportAsync(ReportRequestDto request, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) throw new UnauthorizedAccessException("User not found");

                var issuesQuery = _context.Issues
                    .Include(i => i.Project)
                    .Include(i => i.Reporter)
                    .Include(i => i.Assignee)
                    .AsQueryable();

                // Apply filters
                if (request.StartDate.HasValue)
                    issuesQuery = issuesQuery.Where(i => i.CreatedAt >= request.StartDate.Value);

                if (request.EndDate.HasValue)
                    issuesQuery = issuesQuery.Where(i => i.CreatedAt <= request.EndDate.Value);

                if (request.ProjectIds?.Any() == true)
                    issuesQuery = issuesQuery.Where(i => i.ProjectId.HasValue && request.ProjectIds.Contains(i.ProjectId.Value));

                if (request.UserIds?.Any() == true)
                    issuesQuery = issuesQuery.Where(i => request.UserIds.Contains(i.ReporterId) || 
                                                        (i.AssigneeId != null && request.UserIds.Contains(i.AssigneeId)));

                var issues = await issuesQuery.ToListAsync();

                var reportData = new IssueSummaryReportDto
                {
                    Issues = new List<IssueSummaryItemDto>(),
                    Overview = new IssueOverviewDto(),
                    IssuesByType = new List<IssuesByTypeDto>(),
                    IssuesByStatus = new List<IssuesByStatusDto>()
                };

                foreach (var issue in issues)
                {
                    var issueItem = new IssueSummaryItemDto
                    {
                        Id = issue.Id,
                        Title = issue.Title,
                        ProjectName = issue.Project?.ProjectName ?? "Unknown",
                        Type = issue.Type.ToString(),
                        Status = issue.Status.ToString(),
                        Priority = issue.Priority.ToString(),
                        ReporterName = issue.Reporter?.UserName ?? "Unknown",
                        AssigneeName = issue.Assignee?.UserName,
                        CreatedAt = issue.CreatedAt,
                        ResolvedAt = issue.UpdatedAt,
                        DaysToResolve = issue.UpdatedAt.HasValue ? (int)(issue.UpdatedAt.Value - issue.CreatedAt).TotalDays : 0,
                        IsOverdue = false // TODO: Add due date logic for issues
                    };

                    reportData.Issues.Add(issueItem);
                }

                // Calculate overview
                reportData.Overview = new IssueOverviewDto
                {
                    TotalIssues = issues.Count,
                    OpenIssues = issues.Count(i => i.Status == IssueStatus.Open || i.Status == IssueStatus.InProgress),
                    ResolvedIssues = issues.Count(i => i.Status == IssueStatus.Closed),
                    ClosedIssues = issues.Count(i => i.Status == IssueStatus.Closed),
                    ResolutionRate = issues.Any() ? (double)issues.Count(i => i.Status == IssueStatus.Closed) / issues.Count * 100 : 0,
                    AverageResolutionTime = reportData.Issues.Where(i => i.ResolvedAt.HasValue).Any() ? 
                        reportData.Issues.Where(i => i.ResolvedAt.HasValue).Average(i => i.DaysToResolve) : 0
                };

                // Group by type
                var typeGroups = issues.GroupBy(i => i.Type.ToString()).ToList();
                foreach (var group in typeGroups)
                {
                    reportData.IssuesByType.Add(new IssuesByTypeDto
                    {
                        Type = group.Key,
                        Count = group.Count(),
                        Percentage = issues.Any() ? (double)group.Count() / issues.Count * 100 : 0
                    });
                }

                // Group by status
                var statusGroups = issues.GroupBy(i => i.Status.ToString()).ToList();
                foreach (var group in statusGroups)
                {
                    reportData.IssuesByStatus.Add(new IssuesByStatusDto
                    {
                        Status = group.Key,
                        Count = group.Count(),
                        Percentage = issues.Any() ? (double)group.Count() / issues.Count * 100 : 0
                    });
                }

                return new ReportResponseDto<IssueSummaryReportDto>
                {
                    ReportTitle = "Issue Summary Report",
                    GeneratedAt = DateTime.UtcNow,
                    GeneratedBy = user.UserName ?? string.Empty,
                    ReportType = ReportType.IssueSummary,
                    PeriodStart = request.StartDate,
                    PeriodEnd = request.EndDate,
                    Data = reportData,
                    Summary = new ReportSummaryDto
                    {
                        TotalRecords = issues.Count,
                        KeyMetrics = new Dictionary<string, object>
                        {
                            ["TotalIssues"] = reportData.Overview.TotalIssues,
                            ["ResolutionRate"] = Math.Round(reportData.Overview.ResolutionRate, 2),
                            ["AverageResolutionTime"] = Math.Round(reportData.Overview.AverageResolutionTime, 2),
                            ["OpenIssues"] = reportData.Overview.OpenIssues
                        }
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating issue summary report for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ReportResponseDto<object>> GenerateReportAsync(ReportRequestDto request, string userId)
        {
            switch (request.ReportType)
            {
                case ReportType.ProjectSummary:
                {
                    var report = await GenerateProjectSummaryReportAsync(request, userId);
                    return new ReportResponseDto<object>
                    {
                        ReportTitle = report.ReportTitle,
                        GeneratedAt = report.GeneratedAt,
                        GeneratedBy = report.GeneratedBy,
                        ReportType = report.ReportType,
                        PeriodStart = report.PeriodStart,
                        PeriodEnd = report.PeriodEnd,
                        Data = report.Data,
                        Summary = report.Summary
                    };
                }
                case ReportType.TaskProgress:
                {
                    var report = await GenerateTaskProgressReportAsync(request, userId);
                    return new ReportResponseDto<object>
                    {
                        ReportTitle = report.ReportTitle,
                        GeneratedAt = report.GeneratedAt,
                        GeneratedBy = report.GeneratedBy,
                        ReportType = report.ReportType,
                        PeriodStart = report.PeriodStart,
                        PeriodEnd = report.PeriodEnd,
                        Data = report.Data,
                        Summary = report.Summary
                    };
                }
                case ReportType.TeamPerformance:
                {
                    var report = await GenerateTeamPerformanceReportAsync(request, userId);
                    return new ReportResponseDto<object>
                    {
                        ReportTitle = report.ReportTitle,
                        GeneratedAt = report.GeneratedAt,
                        GeneratedBy = report.GeneratedBy,
                        ReportType = report.ReportType,
                        PeriodStart = report.PeriodStart,
                        PeriodEnd = report.PeriodEnd,
                        Data = report.Data,
                        Summary = report.Summary
                    };
                }
                case ReportType.IssueSummary:
                {
                    var report = await GenerateIssueSummaryReportAsync(request, userId);
                    return new ReportResponseDto<object>
                    {
                        ReportTitle = report.ReportTitle,
                        GeneratedAt = report.GeneratedAt,
                        GeneratedBy = report.GeneratedBy,
                        ReportType = report.ReportType,
                        PeriodStart = report.PeriodStart,
                        PeriodEnd = report.PeriodEnd,
                        Data = report.Data,
                        Summary = report.Summary
                    };
                }
                default:
                    throw new NotSupportedException($"Report type {request.ReportType} is not supported");
            }
        }

        public async Task<byte[]> ExportReportAsync(ReportRequestDto request, string userId)
        {
            var report = await GenerateReportAsync(request, userId);
            
            return request.Format switch
            {
                ReportFormat.Json => System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true })),
                ReportFormat.Csv => await ConvertToCsvAsync(report),
                ReportFormat.Excel => await ConvertToExcelAsync(report),
                ReportFormat.Pdf => await ConvertToPdfAsync(report),
                _ => throw new NotSupportedException($"Export format {request.Format} is not supported")
            };
        }

        public async Task<List<ReportTemplateDto>> GetAvailableReportsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new UnauthorizedAccessException("User not found");
            
            var userRoles = await _userManager.GetRolesAsync(user);
            
            var templates = new List<ReportTemplateDto>
            {
                new()
                {
                    Type = ReportType.ProjectSummary,
                    Name = "Project Summary",
                    Description = "Overview of all projects with progress, tasks, and team information",
                    RequiredParameters = new List<string>(),
                    OptionalParameters = new List<string> { "StartDate", "EndDate", "ProjectIds", "Department" },
                    SupportedFormats = new List<ReportFormat> { ReportFormat.Json, ReportFormat.Csv, ReportFormat.Excel }
                },
                new()
                {
                    Type = ReportType.TaskProgress,
                    Name = "Task Progress",
                    Description = "Detailed view of task completion and progress across projects",
                    RequiredParameters = new List<string>(),
                    OptionalParameters = new List<string> { "StartDate", "EndDate", "ProjectIds", "UserIds" },
                    SupportedFormats = new List<ReportFormat> { ReportFormat.Json, ReportFormat.Csv, ReportFormat.Excel }
                },
                new()
                {
                    Type = ReportType.TeamPerformance,
                    Name = "Team Performance",
                    Description = "Analysis of team member productivity and workload distribution",
                    RequiredParameters = new List<string>(),
                    OptionalParameters = new List<string> { "Department", "ProjectIds", "UserIds" },
                    SupportedFormats = new List<ReportFormat> { ReportFormat.Json, ReportFormat.Csv, ReportFormat.Excel },
                    RequiresManagerRole = true
                },
                new()
                {
                    Type = ReportType.IssueSummary,
                    Name = "Issue Summary",
                    Description = "Summary of issues, bugs, and their resolution status",
                    RequiredParameters = new List<string>(),
                    OptionalParameters = new List<string> { "StartDate", "EndDate", "ProjectIds", "UserIds" },
                    SupportedFormats = new List<ReportFormat> { ReportFormat.Json, ReportFormat.Csv, ReportFormat.Excel }
                }
            };

            // Filter based on user roles
            if (!userRoles.Contains("Manager") && !userRoles.Contains("Admin"))
            {
                templates = templates.Where(t => !t.RequiresManagerRole).ToList();
            }

            return templates;
        }

        public async Task<ReportMetadataDto> GetReportMetadataAsync(ReportType reportType, string userId)
        {
            // Implementation for report metadata - simplified for now
            await Task.CompletedTask;
            
            return new ReportMetadataDto
            {
                Type = reportType,
                Name = reportType.ToString(),
                Description = $"Metadata for {reportType} report",
                AvailableFilters = new List<ReportFilterDto>(),
                AvailableColumns = new List<ReportColumnDto>(),
                Permissions = new ReportPermissionDto { CanView = true, CanExport = true }
            };
        }

        public async Task<bool> ScheduleReportAsync(ScheduledReportDto scheduledReport, string userId)
        {
            // TODO: Implement scheduled reports using Hangfire or similar
            await Task.CompletedTask;
            return true;
        }

        public async Task<List<ScheduledReportDto>> GetScheduledReportsAsync(string userId)
        {
            // TODO: Implement scheduled reports retrieval
            await Task.CompletedTask;
            return new List<ScheduledReportDto>();
        }

        // Helper methods for export formats
        private async Task<byte[]> ConvertToCsvAsync(ReportResponseDto<object> report)
        {
            // TODO: Implement CSV conversion
            await Task.CompletedTask;
            return System.Text.Encoding.UTF8.GetBytes("CSV export not yet implemented");
        }

        private async Task<byte[]> ConvertToExcelAsync(ReportResponseDto<object> report)
        {
            // TODO: Implement Excel conversion using EPPlus or similar
            await Task.CompletedTask;
            return System.Text.Encoding.UTF8.GetBytes("Excel export not yet implemented");
        }

        private async Task<byte[]> ConvertToPdfAsync(ReportResponseDto<object> report)
        {
            // TODO: Implement PDF conversion using iTextSharp or similar
            await Task.CompletedTask;
            return System.Text.Encoding.UTF8.GetBytes("PDF export not yet implemented");
        }
    }
}
