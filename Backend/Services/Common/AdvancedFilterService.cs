using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.ProjectDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.Issue;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.Common
{
    public class AdvancedFilterService : IAdvancedFilterService
    {
        private readonly AppDbContext _context;
        private readonly IPaginationService _paginationService;
        private readonly ILogger<AdvancedFilterService> _logger;

        public AdvancedFilterService(
            AppDbContext context,
            IPaginationService paginationService,
            ILogger<AdvancedFilterService> logger)
        {
            _context = context;
            _paginationService = paginationService;
            _logger = logger;
        }

        public async Task<FilterResultDto<T>> ApplyAdvancedFilterAsync<T>(
            IQueryable<T> query,
            AdvancedFilterDto filterDto) where T : class
        {
            try
            {
                var paginationDto = new PaginationDto
                {
                    PageNumber = filterDto.PageNumber,
                    PageSize = filterDto.PageSize,
                    SearchTerm = filterDto.SearchTerm,
                    SortBy = filterDto.SortBy,
                    SortDescending = filterDto.SortDescending
                };

                var paginatedResult = await _paginationService.GetPaginatedResultAsync(query, paginationDto);

                return new FilterResultDto<T>
                {
                    Items = paginatedResult.Items,
                    TotalCount = paginatedResult.TotalCount,
                    PageNumber = paginatedResult.PageNumber,
                    PageSize = paginatedResult.PageSize,
                    TotalPages = paginatedResult.TotalPages,
                    HasNextPage = paginatedResult.PageNumber < paginatedResult.TotalPages,
                    HasPreviousPage = paginatedResult.PageNumber > 1,
                    AppliedFilters = new Dictionary<string, object>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying advanced filter");
                throw;
            }
        }

        public async Task<FilterResultDto<ProjectDto>> FilterProjectsAsync(ProjectFilterDto filterDto)
        {
            var query = _context.Projects.AsQueryable();

            if (filterDto.Statuses?.Any() == true)
                query = query.Where(p => filterDto.Statuses.Contains(p.Status));

            if (filterDto.Priorities?.Any() == true)
                query = query.Where(p => filterDto.Priorities.Contains(p.Priority));

            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                query = query.Where(p => p.ProjectName.Contains(filterDto.SearchTerm) || 
                                       p.Description.Contains(filterDto.SearchTerm));
            }

            var projectDtos = await query.Select(p => new ProjectDto
            {
                Id = p.Id,
                ProjectName = p.ProjectName,
                Description = p.Description,
                Department = p.Department,
                ProjectOwner = p.ProjectOwner,
                ProjectOwnerPhone = p.ProjectOwnerPhone,
                ProjectOwnerEmail = p.ProjectOwnerEmail,
                Priority = p.Priority,
                DueDate = p.DueDate ?? DateTime.UtcNow,
                Status = p.Status,
                CreatedDate = p.CreatedDate ?? DateTime.UtcNow,
                UpdatedDate = p.UpdatedDate,
                CreateUser = p.CreateUser ?? string.Empty,
                UpdateUser = p.UpdateUser ?? string.Empty,
                Version = p.Version,
                ApprovalStatus = p.ApprovalStatus,
                CreatedByUserId = p.CreatedByUserId,
                ApprovedByUserId = p.ApprovedByUserId,
                ApprovalDate = p.ApprovalDate,
                ApprovalNotes = p.ApprovalNotes,
                RejectionReason = p.RejectionReason
            }).ToListAsync();

            var totalCount = projectDtos.Count;
            var items = projectDtos
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToList();

            return new FilterResultDto<ProjectDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasNextPage = filterDto.PageNumber < (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasPreviousPage = filterDto.PageNumber > 1,
                AppliedFilters = new Dictionary<string, object>()
            };
        }

        public async Task<List<FilterOptionDto>> GetProjectFilterOptionsAsync()
        {
            return new List<FilterOptionDto>
            {
                new FilterOptionDto
                {
                    Field = "SearchTerm",
                    Label = "Search",
                    Type = "text",
                    Placeholder = "Search projects...",
                    HelpText = "Search in project name and description"
                },
                new FilterOptionDto
                {
                    Field = "Statuses",
                    Label = "Status",
                    Type = "multiselect",
                    Options = new List<string> { "Active", "On Hold", "Completed", "Archived" }
                },
                new FilterOptionDto
                {
                    Field = "Priorities",
                    Label = "Priority",
                    Type = "multiselect",
                    Options = new List<string> { "Low", "Medium", "High", "Critical" }
                }
            };
        }

        public async Task<Dictionary<string, object>> GetProjectFilterValuesAsync()
        {
            return new Dictionary<string, object>
            {
                ["Statuses"] = await _context.Projects.Select(p => p.Status).Distinct().ToListAsync(),
                ["Priorities"] = await _context.Projects.Select(p => p.Priority).Distinct().ToListAsync()
            };
        }

        public async Task<FilterResultDto<ProjectTaskReadDto>> FilterTasksAsync(TaskFilterDto filterDto)
        {
            var query = _context.ProjectTasks.AsQueryable();

            if (filterDto.TaskStatuses?.Any() == true)
                query = query.Where(t => filterDto.TaskStatuses.Contains(t.Status.ToString()));

            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                query = query.Where(t => t.Title.Contains(filterDto.SearchTerm) || 
                                       t.Description.Contains(filterDto.SearchTerm));
            }

            var taskDtos = await query.Select(t => new ProjectTaskReadDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                ProjectAssignmentId = t.ProjectAssignmentId,
                AssignedMemberId = t.AssignedMemberId,
                Priority = t.Priority,
                Progress = t.Progress,
                DueDate = t.DueDate,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToListAsync();

            var totalCount = taskDtos.Count;
            var items = taskDtos
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToList();

            return new FilterResultDto<ProjectTaskReadDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasNextPage = filterDto.PageNumber < (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasPreviousPage = filterDto.PageNumber > 1,
                AppliedFilters = new Dictionary<string, object>(),
                AvailableFilters = await GetTaskFilterOptionsAsync()
            };
        }

        public async Task<List<FilterOptionDto>> GetTaskFilterOptionsAsync()
        {
            return new List<FilterOptionDto>
            {
                new FilterOptionDto
                {
                    Field = "SearchTerm",
                    Label = "Search",
                    Type = "text",
                    Placeholder = "Search tasks...",
                    HelpText = "Search in task name and description"
                },
                new FilterOptionDto
                {
                    Field = "TaskStatuses",
                    Label = "Status",
                    Type = "multiselect",
                    Options = new List<string> { "Not Started", "In Progress", "Completed", "On Hold" }
                }
            };
        }

        public async Task<Dictionary<string, object>> GetTaskFilterValuesAsync()
        {
            return new Dictionary<string, object>
            {
                ["TaskStatuses"] = await _context.ProjectTasks.Select(t => t.Status).Distinct().ToListAsync()
            };
        }

        public async Task<FilterResultDto<EnhancedAssignmentDto>> FilterAssignmentsAsync(AssignmentFilterDto filterDto)
        {
            var query = _context.ProjectAssignments.AsQueryable();

            if (filterDto.MemberRoles?.Any() == true)
                query = query.Where(a => filterDto.MemberRoles.Contains(a.MemberRole));

            query = query.Include(a => a.Project).Include(a => a.Member);

            var assignmentDtos = await query.Select(a => new EnhancedAssignmentDto
            {
                Id = a.Id,
                ProjectId = a.ProjectId,
                ProjectName = a.Project.ProjectName,
                MemberId = a.MemberId,
                MemberName = a.Member.UserName,
                MemberEmail = a.Member.Email,
                MemberRole = a.MemberRole,
                Role = a.Role,
                Status = a.Status,
                IsPrimaryScrumMaster = a.IsPrimaryScrumMaster,
                WorkloadPercentage = a.WorkloadPercentage,
                AssignmentStartDate = a.AssignmentStartDate,
                AssignmentEndDate = a.AssignmentEndDate,
                AssignmentNotes = a.AssignmentNotes,
                IsActive = a.IsActive,
                CreatedDate = a.CreatedDate,
                ApprovedBy = a.ApprovedById,
                ApprovedDate = a.ApprovedDate
            }).ToListAsync();

            var totalCount = assignmentDtos.Count;
            var items = assignmentDtos
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToList();

            return new FilterResultDto<EnhancedAssignmentDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasNextPage = filterDto.PageNumber < (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasPreviousPage = filterDto.PageNumber > 1,
                AppliedFilters = new Dictionary<string, object>(),
                AvailableFilters = await GetAssignmentFilterOptionsAsync()
            };
        }

        public async Task<List<FilterOptionDto>> GetAssignmentFilterOptionsAsync()
        {
            return new List<FilterOptionDto>
            {
                new FilterOptionDto
                {
                    Field = "MemberRoles",
                    Label = "Role",
                    Type = "multiselect",
                    Options = new List<string> { "ScrumMaster", "TeamMember", "TeamLeader" }
                }
            };
        }

        public async Task<Dictionary<string, object>> GetAssignmentFilterValuesAsync()
        {
            return new Dictionary<string, object>
            {
                ["MemberRoles"] = await _context.ProjectAssignments.Select(a => a.MemberRole).Distinct().ToListAsync()
            };
        }

        public async Task<FilterResultDto<IssueDto>> FilterIssuesAsync(IssueFilterDto filterDto)
        {
            var query = _context.Issues.AsQueryable();

            if (filterDto.IssueTypes?.Any() == true)
                query = query.Where(i => filterDto.IssueTypes.Contains(i.Type.ToString()));

            if (filterDto.IssueStatuses?.Any() == true)
                query = query.Where(i => filterDto.IssueStatuses.Contains(i.Status.ToString()));

            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                query = query.Where(i => i.Title.Contains(filterDto.SearchTerm) || 
                                       i.Description.Contains(filterDto.SearchTerm));
            }

            var issueDtos = await query.Select(i => new IssueDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                ProjectId = i.ProjectId,
                Status = i.Status,
                Priority = i.Priority,
                Type = i.Type,
                AssigneeId = i.AssigneeId,
                ReporterId = i.ReporterId,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToListAsync();

            var totalCount = issueDtos.Count;
            var items = issueDtos
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToList();

            return new FilterResultDto<IssueDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasNextPage = filterDto.PageNumber < (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                HasPreviousPage = filterDto.PageNumber > 1,
                AppliedFilters = new Dictionary<string, object>(),
                AvailableFilters = await GetIssueFilterOptionsAsync()
            };
        }

        public async Task<List<FilterOptionDto>> GetIssueFilterOptionsAsync()
        {
            return new List<FilterOptionDto>
            {
                new FilterOptionDto
                {
                    Field = "SearchTerm",
                    Label = "Search",
                    Type = "text",
                    Placeholder = "Search issues...",
                    HelpText = "Search in issue title and description"
                },
                new FilterOptionDto
                {
                    Field = "IssueTypes",
                    Label = "Type",
                    Type = "multiselect",
                    Options = Enum.GetValues(typeof(IssueType)).Cast<IssueType>().Select(t => t.ToString()).ToList()
                },
                new FilterOptionDto
                {
                    Field = "IssueStatuses",
                    Label = "Status",
                    Type = "multiselect",
                    Options = new List<string> { "Open", "In Progress", "Resolved", "Closed", "Reopened" }
                }
            };
        }

        public async Task<Dictionary<string, object>> GetIssueFilterValuesAsync()
        {
            return new Dictionary<string, object>
            {
                ["IssueTypes"] = Enum.GetValues(typeof(IssueType)).Cast<IssueType>().Select(t => t.ToString()).ToList(),
                ["IssueStatuses"] = await _context.Issues.Select(i => i.Status).Distinct().ToListAsync()
            };
        }

        public async Task<FilterResultDto<T>> ApplyCascadedFilterAsync<T>(
            IQueryable<T> query,
            CascadedFilterDto cascadedFilter) where T : class
        {
            var items = await query.ToListAsync();

            return new FilterResultDto<T>
            {
                Items = items,
                TotalCount = items.Count,
                PageNumber = 1,
                PageSize = items.Count,
                TotalPages = 1,
                HasNextPage = false,
                HasPreviousPage = false,
                AppliedFilters = new Dictionary<string, object>()
            };
        }

        public async Task<FilterResultDto<T>> SearchAsync<T>(
            IQueryable<T> query,
            string searchTerm,
            string? searchFields = null) where T : class
        {
            var items = await query.ToListAsync();

            return new FilterResultDto<T>
            {
                Items = items,
                TotalCount = items.Count,
                PageNumber = 1,
                PageSize = items.Count,
                TotalPages = 1,
                HasNextPage = false,
                HasPreviousPage = false,
                AppliedFilters = new Dictionary<string, object>()
            };
        }

        public IQueryable<T> BuildFilterQuery<T>(
            IQueryable<T> query,
            AdvancedFilterDto filterDto) where T : class
        {
            return query;
        }

        public bool ValidateFilter(AdvancedFilterDto filterDto)
        {
            return filterDto.PageNumber > 0 && filterDto.PageSize > 0 && filterDto.PageSize <= 1000;
        }

        public List<string> GetValidationErrors(AdvancedFilterDto filterDto)
        {
            var errors = new List<string>();

            if (filterDto.PageNumber < 1)
                errors.Add("Page number must be greater than 0");

            if (filterDto.PageSize < 1 || filterDto.PageSize > 1000)
                errors.Add("Page size must be between 1 and 1000");

            return errors;
        }
    }
}
