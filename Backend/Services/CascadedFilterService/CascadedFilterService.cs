using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.CascadedFilterDto;
using ProjectManagementSystem1.Model.Entities;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.CascadedFilterService
{
    public class CascadedFilterService : ICascadedFilterService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CascadedFilterService> _logger;

        public CascadedFilterService(AppDbContext context, ILogger<CascadedFilterService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<FilterOptionDto>> GetDepartmentsAsync()
        {
            var departments = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.Department))
                .Select(u => u.Department)
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();

            return departments.Select(d => new FilterOptionDto
            {
                Value = d,
                Label = d,
                Description = $"Department: {d}"
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetProjectsByDepartmentAsync(string department)
        {
            var projects = await _context.Projects
                .Where(p => p.Department == department && !p.IsArchived)
                .OrderBy(p => p.ProjectName)
                .ToListAsync();

            return projects.Select(p => new FilterOptionDto
            {
                Value = p.Id.ToString(),
                Label = p.ProjectName,
                Description = $"{p.Priority} priority - Due: {p.DueDate?.ToString("yyyy-MM-dd")}",
                Metadata = new Dictionary<string, object>
                {
                    ["priority"] = p.Priority,
                    ["status"] = p.Status,
                    ["dueDate"] = p.DueDate
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetMilestonesByProjectAsync(int projectId)
        {
            var milestones = await _context.Milestones
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.DueDate)
                .ToListAsync();

            return milestones.Select(m => new FilterOptionDto
            {
                Value = m.MilestoneId.ToString(),
                Label = m.MilestoneName,
                Description = $"Due: {m.DueDate.ToString("yyyy-MM-dd")} - {m.Status}",
                Metadata = new Dictionary<string, object>
                {
                    ["status"] = m.Status.ToString(),
                    ["dueDate"] = m.DueDate,
                    ["progress"] = m.Progress
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetTasksByProjectAsync(int projectId)
        {
            var tasks = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Where(t => t.ProjectAssignment.ProjectId == projectId)
                .OrderBy(t => t.Title)
                .ToListAsync();

            return tasks.Select(t => new FilterOptionDto
            {
                Value = t.Id.ToString(),
                Label = t.Title,
                Description = $"{t.Priority} priority - {t.Status}",
                Metadata = new Dictionary<string, object>
                {
                    ["priority"] = t.Priority.ToString(),
                    ["status"] = t.Status.ToString(),
                    ["assignedMemberId"] = t.AssignedMemberId ?? "",
                    ["dueDate"] = t.DueDate,
                    ["progress"] = t.Progress
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetUsersByDepartmentAsync(string department)
        {
            var users = await _context.Users
                .Where(u => u.Department == department)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return users.Select(u => new FilterOptionDto
            {
                Value = u.Id,
                Label = u.FullName,
                Description = $"{u.Email} - Employee ID: {u.EmployeeId}",
                Metadata = new Dictionary<string, object>
                {
                    ["employeeId"] = u.EmployeeId,
                    ["email"] = u.Email,
                    ["department"] = u.Department
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetUsersByProjectAsync(int projectId)
        {
            var users = await _context.ProjectAssignments
                .Include(pa => pa.Member)
                .Where(pa => pa.ProjectId == projectId)
                .Select(pa => pa.Member)
                .Distinct()
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return users.Select(u => new FilterOptionDto
            {
                Value = u.Id,
                Label = u.FullName,
                Description = $"{u.Email} - Employee ID: {u.EmployeeId}",
                Metadata = new Dictionary<string, object>
                {
                    ["employeeId"] = u.EmployeeId,
                    ["email"] = u.Email,
                    ["department"] = u.Department
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetIssuesByProjectAsync(int projectId)
        {
            var issues = await _context.Issues
                .Where(i => i.ProjectId == projectId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return issues.Select(i => new FilterOptionDto
            {
                Value = i.Id.ToString(),
                Label = i.Title,
                Description = $"{i.Type} - {i.Priority} priority - {i.Status}",
                Metadata = new Dictionary<string, object>
                {
                    ["type"] = i.Type.ToString(),
                    ["priority"] = i.Priority.ToString(),
                    ["status"] = i.Status.ToString(),
                    ["assigneeId"] = i.AssigneeId ?? "",
                    ["createdAt"] = i.CreatedAt
                }
            }).ToList();
        }

        public async Task<List<FilterOptionDto>> GetIssuesByTaskAsync(int taskId)
        {
            var issues = await _context.Issues
                .Where(i => i.ProjectTaskId == taskId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return issues.Select(i => new FilterOptionDto
            {
                Value = i.Id.ToString(),
                Label = i.Title,
                Description = $"{i.Type} - {i.Priority} priority - {i.Status}",
                Metadata = new Dictionary<string, object>
                {
                    ["type"] = i.Type.ToString(),
                    ["priority"] = i.Priority.ToString(),
                    ["status"] = i.Status.ToString(),
                    ["assigneeId"] = i.AssigneeId ?? "",
                    ["createdAt"] = i.CreatedAt
                }
            }).ToList();
        }

        public async Task<CascadedFilterDataDto> GetCascadedFilterDataAsync(CascadedFilterRequestDto request)
        {
            var result = new CascadedFilterDataDto();

            // Always provide departments
            result.Departments = await GetDepartmentsAsync();

            // Add static enum options
            result.Priorities = Enum.GetValues<TaskPriority>()
                .Select(p => new FilterOptionDto { Value = p.ToString(), Label = p.ToString() })
                .ToList();

            result.Statuses = Enum.GetValues<TaskStatus>()
                .Select(s => new FilterOptionDto { Value = s.ToString(), Label = s.ToString() })
                .ToList();

            result.IssueTypes = Enum.GetValues<IssueType>()
                .Select(t => new FilterOptionDto { Value = t.ToString(), Label = t.ToString() })
                .ToList();

            result.Roles = new List<FilterOptionDto>
            {
                new() { Value = "ScrumMaster", Label = "Scrum Master" },
                new() { Value = "TeamLeader", Label = "Team Leader" },
                new() { Value = "Member", Label = "Member" },
                new() { Value = "Developer", Label = "Developer" },
                new() { Value = "Tester", Label = "Tester" },
                new() { Value = "Analyst", Label = "Analyst" }
            };

            // Cascaded data based on selections
            if (!string.IsNullOrEmpty(request.Department))
            {
                result.Projects = await GetProjectsByDepartmentAsync(request.Department);
                result.Users = await GetUsersByDepartmentAsync(request.Department);
            }

            if (request.ProjectId.HasValue)
            {
                result.Milestones = await GetMilestonesByProjectAsync(request.ProjectId.Value);
                result.Tasks = await GetTasksByProjectAsync(request.ProjectId.Value);
                result.Issues = await GetIssuesByProjectAsync(request.ProjectId.Value);
                
                // Override users to show only project members if project is selected
                if (result.Users.Count == 0)
                {
                    result.Users = await GetUsersByProjectAsync(request.ProjectId.Value);
                }
            }

            if (request.TaskId.HasValue)
            {
                // Get issues specific to this task
                var taskIssues = await GetIssuesByTaskAsync(request.TaskId.Value);
                if (taskIssues.Any())
                {
                    result.Issues = taskIssues;
                }
            }

            return result;
        }
    }
}
