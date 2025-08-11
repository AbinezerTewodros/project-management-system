using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto.Issue;

namespace ProjectManagementSystem1.Services.IssueService
{
    public class IssueService : IIssueService
    {
        private readonly AppDbContext _context;

        public IssueService(AppDbContext context)
        {
            _context = context;
        }

        // --- Helper Methods for Mapping ---
        private async Task<IssueDto> MapIssueToDto(Issue issue)
        {
            if (issue == null) return null;

            // Explicitly load user data
            if (issue.Reporter == null && !string.IsNullOrEmpty(issue.ReporterId))
                issue.Reporter = await _context.Users.FindAsync(issue.ReporterId);

            if (issue.Assignee == null && !string.IsNullOrEmpty(issue.AssigneeId))
                issue.Assignee = await _context.Users.FindAsync(issue.AssigneeId);

            return new IssueDto
            {
                Id = issue.Id,
                Title = issue.Title,
                Description = issue.Description,
                Status = issue.Status,
                Priority = issue.Priority,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                ReporterId = issue.ReporterId.ToString(), 
                ReporterUsername = issue.Reporter?.UserName,
                AssigneeId = issue.AssigneeId.ToString(),
                AssigneeUsername = issue.Assignee?.UserName,
                ProjectId = issue.ProjectId,
                ProjectName = issue.Project?.ProjectName,
                ProjectTaskId = issue.ProjectTaskId,
                ProjectTaskTitle = issue.ProjectTask?.Title,
                IndependentTaskId = issue.IndependentTaskId,
                IndependentTaskTitle = issue.IndependentTask?.Title

            };
        }

        private async Task<IEnumerable<IssueDto>> MapIssuesToDtos(IQueryable<Issue> issuesQuery)
        {
            // Execute the query to get the list of issues with included navigation properties
            var issuesList = await issuesQuery
                             .Include(i => i.Reporter)
                             .Include(i => i.Assignee)
                             .ToListAsync();

            var dtos = new List<IssueDto>();
            foreach (var issue in issuesList)
            {
                dtos.Add(await MapIssueToDto(issue)); // Use the single-issue mapper
            }
            return dtos;
        }

        // --- Endpoint Implementations ---

        // POST /issues
        // AFTER (Fixed)
        public async Task<IssueDto> CreateIssueAsync(IssueCreateDto issueCreateDto, string reporterId)
        {
            // Validate reporter exists
            var reporterExists = await _context.Users.AnyAsync(u => u.Id == reporterId);
            if (!reporterExists)
                throw new InvalidOperationException("Reporter not found");


            // Validate assignee (if provided)
            if (!string.IsNullOrEmpty(issueCreateDto.AssigneeId))
            {
                var assigneeExists = await _context.Users.AnyAsync(u => u.Id == issueCreateDto.AssigneeId);
                if (!assigneeExists)
                    throw new InvalidOperationException("Assignee not found");
            }

            // Project
            int? projectId = null;
            // Check if the nullable int has a value
            if (issueCreateDto.ProjectId.HasValue)
            {
                // Use .Value to get the non-nullable int
                var projectExists = await _context.Projects.AnyAsync(p => p.Id == issueCreateDto.ProjectId.Value);
                if (!projectExists)
                {
                    throw new InvalidOperationException($"Project with ID {issueCreateDto.ProjectId.Value} does not exist.");
                }
                projectId = issueCreateDto.ProjectId.Value;
            }

            // Project task
            int? projectTaskId = null;
            if (issueCreateDto.ProjectTaskId.HasValue)
            {
                var projectTaskExists = await _context.ProjectTasks.AnyAsync(pt => pt.Id == issueCreateDto.ProjectTaskId.Value);
                if (!projectTaskExists)
                {
                    throw new InvalidOperationException($"Project Task with ID {issueCreateDto.ProjectTaskId.Value} does not exist.");
                }
                projectTaskId = issueCreateDto.ProjectTaskId.Value;
            }

            // Independent task
            int? independentTaskId = null;
            if (issueCreateDto.IndependentTaskId.HasValue)
            {
                var independentTaskExists = await _context.IndependentTasks.AnyAsync(it => it.TaskId == issueCreateDto.IndependentTaskId.Value);
                if (!independentTaskExists)
                {
                    throw new InvalidOperationException($"Independent Task with ID {issueCreateDto.IndependentTaskId.Value} does not exist.");
                }
                independentTaskId = issueCreateDto.IndependentTaskId.Value;
            }

            // Create the Issue - FIXED: Use parsed integers, not original strings
            var issue = new Issue
            {
                Title = issueCreateDto.Title,
                Description = issueCreateDto.Description,
                Status = issueCreateDto.Status ?? IssueStatus.Open,
                Priority = issueCreateDto.Priority ?? IssuePriority.Medium,
                CreatedAt = DateTime.UtcNow,
                ReporterId = reporterId.ToString(),  // FIX: Use parsed int value
                AssigneeId = issueCreateDto.AssigneeId.ToString(),
                ProjectId = issueCreateDto.ProjectId,
                ProjectTaskId = issueCreateDto.ProjectTaskId,
                IndependentTaskId = issueCreateDto.IndependentTaskId
            };

            _context.Issues.Add(issue);
            await _context.SaveChangesAsync();

            return await MapIssueToDto(issue);
        }

        // GET /issues/{issueId}
        public async Task<IssueDto> GetIssueByIdAsync(int issueId)
        {
            var issue = await _context.Issues
                                 .Include(i => i.Reporter)
                                 .Include(i => i.Assignee)
                                 .Include(i => i.Project)
                                 .Include(i => i.ProjectTask)
                                 .Include(i => i.IndependentTask)
                                 .FirstOrDefaultAsync(i => i.Id == issueId);

            if (issue == null)
            {
                return null;
            }

            return await MapIssueToDto(issue);
        }

        // GET /issues
        public async Task<IEnumerable<IssueDto>> GetAllIssuesAsync()
        {
            // Include related entities (Reporter and Assignee) directly in the query for efficiency
            IQueryable<Issue> issues = _context.Issues
                                            .OrderByDescending(i => i.CreatedAt);

            return await MapIssuesToDtos(issues);
        }

        // PATCH /issues/{issueId}
        public async Task<IssueDto> UpdateIssueAsync(int issueId, IssueUpdateDto issueUpdateDto)
        {
            var issue = await _context.Issues.FindAsync(issueId);
            if (issue == null)
            {
                return null; // Issue not found
            }

            // Apply updates only if the corresponding DTO property is provided (not null/empty)
            if (!string.IsNullOrWhiteSpace(issueUpdateDto.Title))
            {
                issue.Title = issueUpdateDto.Title;
            }

            if (!string.IsNullOrWhiteSpace(issueUpdateDto.Description))
            {
                issue.Description = issueUpdateDto.Description;
            }

            if (issueUpdateDto.Status.HasValue)
            {
                issue.Status = issueUpdateDto.Status.Value;
            }

            if (issueUpdateDto.Priority.HasValue)
            {
                issue.Priority = issueUpdateDto.Priority.Value;
            }

            // Handle AssigneeId update
            // Update assignee
            if (issueUpdateDto.AssigneeId != null)
            {
                var assigneeExists = await _context.Users.AnyAsync(u => u.Id == issueUpdateDto.AssigneeId);
                if (!assigneeExists)
                    throw new InvalidOperationException("Assignee not found");

                issue.AssigneeId = issueUpdateDto.AssigneeId;
            }


            issue.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Load navigation properties for the DTO after saving changes
            await _context.Entry(issue).Reference(i => i.Reporter).LoadAsync();
            if (!string.IsNullOrEmpty(issue.AssigneeId))
            {
                await _context.Entry(issue).Reference(i => i.Assignee).LoadAsync();
            }

            return await MapIssueToDto(issue);
        }

        // DELETE /issues/{issueId}
        public async Task<IssueDeletedDto> DeleteIssueAsync(int issueId)
        {
            var issue = await _context.Issues.FindAsync(issueId);
            if (issue == null)
            {
                return null; // Indicates not found
            }

            // Capture data before deletion for the DTO
            var deletedDto = new IssueDeletedDto
            {
                Id = issue.Id,
                Title = issue.Title,
                LastKnownStatus = issue.Status,
                Message = $"Issue '{issue.Title}' (ID: {issue.Id}) successfully deleted.",
                DeletionTimestamp = DateTime.UtcNow
            };

            _context.Issues.Remove(issue);
            await _context.SaveChangesAsync();

            return deletedDto;
        }


        // GET /issues/search
        public async Task<IEnumerable<IssueDto>> SearchIssuesAsync(IssueSearchDto searchDto)
        {
            IQueryable<Issue> query = _context.Issues;

            if (!string.IsNullOrWhiteSpace(searchDto.Title))
            {
                query = query.Where(i => i.Title.Contains(searchDto.Title));
            }

            if (searchDto.Status.HasValue)
            {
                query = query.Where(i => i.Status == searchDto.Status.Value);
            }

            if (searchDto.Priority.HasValue)
            {
                query = query.Where(i => i.Priority == searchDto.Priority.Value);
            }

            // Use string IDs directly
            if (!string.IsNullOrEmpty(searchDto.AssigneeId))
                query = query.Where(i => i.AssigneeId == searchDto.AssigneeId);

            if (!string.IsNullOrEmpty(searchDto.ReporterId))
                query = query.Where(i => i.ReporterId == searchDto.ReporterId);

            if (!string.IsNullOrWhiteSpace(searchDto.Keywords))
            {
                // Simple keyword search across title and description
                query = query.Where(i => i.Title.Contains(searchDto.Keywords) ||
                                         (i.Description != null && i.Description.Contains(searchDto.Keywords)));
            }

            return await MapIssuesToDtos(query.OrderByDescending(i => i.CreatedAt));
        }

        // GET /issues/reports
        public async Task<IEnumerable<IssueReportDto>> GetIssueReportsAsync()
        {
            var reports = await _context.Issues
             .GroupBy(i => i.Status)
             .Select(g => new IssueReportDto
             {
                 Status = g.Key,
                 Count = g.Count()
             })
             .OrderBy(r => r.Status)
             .ToListAsync();

            return reports;
        }
    }
}
