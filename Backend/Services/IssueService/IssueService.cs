using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto.Issue;
using ProjectManagementSystem1.Services;

namespace ProjectManagementSystem1.Services.IssueService
{
    public class IssueService : IIssueService
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public IssueService(AppDbContext context, IActivityLogService activityLogService)
        {
            _context = context;
            _activityLogService = activityLogService;
        }

        // --- Helper Methods for Mapping ---
        private async Task<IssueDto> MapIssueToDto(Issue issue)
        {
            if (issue == null) return null;

            if (issue.Reporter == null && int.TryParse(issue.ReporterId, out int reporterId) && reporterId > 0)
            {
                issue.Reporter = await _context.Users.FindAsync(reporterId.ToString());
            }
            if (issue.Assignee == null && !string.IsNullOrEmpty(issue.AssigneeId) && int.TryParse(issue.AssigneeId, out int assigneeId) && assigneeId > 0)
            {
                issue.Assignee = await _context.Users.FindAsync(assigneeId.ToString());
            }

            return new IssueDto
            {
                Id = issue.Id,
                Title = issue.Title,
                Description = issue.Description,
                Status = issue.Status,
                Priority = issue.Priority,
                Type = issue.Type,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                ReporterId = issue.ReporterId.ToString(),
                ReporterUsername = issue.Reporter?.UserName, // Null-conditional operator
                AssigneeId = issue.AssigneeId.ToString(),
                AssigneeUsername = issue.Assignee?.UserName, // Null-conditional operator
                ProjectId = issue.ProjectId,
                ProjectName = issue.Project?.ProjectName,
                ProjectTaskId = issue.ProjectTaskId,
                ProjectTaskTitle = issue.ProjectTask?.Title,



            };
        }

        private async Task<IEnumerable<IssueDto>> MapIssuesToDtos(IQueryable<Issue> issuesQuery)
        {
            // CRITICAL FIX: Use efficient projection to avoid N+1 queries
            var dtos = await issuesQuery
                .Include(i => i.Reporter)
                .Include(i => i.Assignee)
                .Select(i => new IssueDto
                {
                    Id = i.Id,
                    Title = i.Title,
                    Description = i.Description,
                    Status = i.Status,
                    Priority = i.Priority,
                    Type = i.Type,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ReporterId = i.ReporterId,
                    ReporterUsername = i.Reporter != null ? i.Reporter.UserName : "Unknown",
                    AssigneeId = i.AssigneeId,
                    AssigneeUsername = i.Assignee != null ? i.Assignee.UserName : "Unassigned",
                    ProjectId = i.ProjectId,
                    ProjectTaskId = i.ProjectTaskId,
    
                })
                .AsNoTracking()
                .ToListAsync();

            return dtos;
        }

        // --- Endpoint Implementations ---

        // POST /issues
        // AFTER (Fixed)
        public async Task<IssueDto> CreateIssueAsync(IssueCreateDto issueCreateDto)
        {
            // Validate Reporter ID
            if (string.IsNullOrWhiteSpace(issueCreateDto.ReporterId) ||
                !int.TryParse(issueCreateDto.ReporterId, out int reporterId) ||
                reporterId <= 0)
            {
                throw new InvalidOperationException("Reporter ID must be a positive integer");
            }

            var reporterExists = await _context.Users.AnyAsync(u => u.Id == reporterId.ToString());
            if (!reporterExists)
            {
                throw new InvalidOperationException($"Reporter with ID {reporterId} does not exist.");
            }

            // Handle Assignee ID
            int? assigneeId = null;
            if (!string.IsNullOrWhiteSpace(issueCreateDto.AssigneeId) &&
                int.TryParse(issueCreateDto.AssigneeId, out int parsedAssigneeId))
            {
                var assigneeExists = await _context.Users.AnyAsync(u => u.Id == parsedAssigneeId.ToString());
                if (!assigneeExists)
                {
                    throw new InvalidOperationException($"Assignee with ID {parsedAssigneeId} does not exist.");
                }
                assigneeId = parsedAssigneeId;
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


            // Create the Issue - FIXED: Use parsed integers, not original strings
            var issue = new Issue
            {
                Title = issueCreateDto.Title,
                Description = issueCreateDto.Description,
                Status = issueCreateDto.Status ?? IssueStatus.Open,
                Priority = issueCreateDto.Priority ?? IssuePriority.Medium,
                Type = issueCreateDto.Type ?? IssueType.Other,
                CreatedAt = DateTime.UtcNow,
                ReporterId = reporterId.ToString(),  // FIX: Use parsed int value
                AssigneeId = assigneeId.ToString(),    // FIX: Use parsed int? value
                ProjectId = projectId,
                ProjectTaskId = projectTaskId,

            };

            _context.Issues.Add(issue);
            await _context.SaveChangesAsync();

            // Log issue creation
            await _activityLogService.LogActivityAsync(
                userId: issue.ReporterId,
                entityType: "Issue",
                entityId: issue.Id,
                actionType: "Created",
                details: $"Issue '{issue.Title}' created with priority {issue.Priority} and type {issue.Type}"
            );

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

            // Store old values for logging
            var oldTitle = issue.Title;
            var oldDescription = issue.Description;
            var oldStatus = issue.Status;
            var oldPriority = issue.Priority;
            var oldAssigneeId = issue.AssigneeId;

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
            // Assuming issueUpdateDto.AssigneeId is string or string?
            if (!string.IsNullOrWhiteSpace(issueUpdateDto.AssigneeId))
            {
                if (int.TryParse(issueUpdateDto.AssigneeId, out int parsedAssigneeId)) // [1, 2, 3]
                {
                    var assigneeExists = await _context.Users.AnyAsync(u => u.Id == parsedAssigneeId.ToString());
                    if (!assigneeExists)
                    {
                        throw new InvalidOperationException($"Assignee with ID {parsedAssigneeId} does not exist.");
                    }
                    issue.AssigneeId = parsedAssigneeId.ToString();
                }
                else
                {
                    throw new InvalidOperationException($"Invalid format for Assignee ID: '{issueUpdateDto.AssigneeId}'. Must be an integer if provided.");
                }
            }
            else if (issueUpdateDto.AssigneeId == null) // Explicitly allow unassigning if the DTO property is null
            {
                issue.AssigneeId = null;
            }


            issue.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log issue update with field changes
            var fieldChanges = new List<FieldChange>();
            
            if (!string.IsNullOrWhiteSpace(issueUpdateDto.Title) && issueUpdateDto.Title != oldTitle)
                fieldChanges.Add(new FieldChange { FieldName = "Title", OldValue = oldTitle, NewValue = issueUpdateDto.Title, FieldType = "string" });
            
            if (!string.IsNullOrWhiteSpace(issueUpdateDto.Description) && issueUpdateDto.Description != oldDescription)
                fieldChanges.Add(new FieldChange { FieldName = "Description", OldValue = oldDescription, NewValue = issueUpdateDto.Description, FieldType = "string" });
            
            if (issueUpdateDto.Status.HasValue && issueUpdateDto.Status.Value != oldStatus)
                fieldChanges.Add(new FieldChange { FieldName = "Status", OldValue = oldStatus.ToString(), NewValue = issueUpdateDto.Status.Value.ToString(), FieldType = "enum" });
            
            if (issueUpdateDto.Priority.HasValue && issueUpdateDto.Priority.Value != oldPriority)
                fieldChanges.Add(new FieldChange { FieldName = "Priority", OldValue = oldPriority.ToString(), NewValue = issueUpdateDto.Priority.Value.ToString(), FieldType = "enum" });
            
            if (!string.IsNullOrWhiteSpace(issueUpdateDto.AssigneeId) && issueUpdateDto.AssigneeId != oldAssigneeId)
                fieldChanges.Add(new FieldChange { FieldName = "AssigneeId", OldValue = oldAssigneeId, NewValue = issueUpdateDto.AssigneeId, FieldType = "string" });

            if (fieldChanges.Any())
            {
                await _activityLogService.LogActivityWithFieldChangesAsync(
                    userId: issue.ReporterId,
                    entityType: "Issue",
                    entityId: issue.Id,
                    actionType: "Updated",
                    entityName: $"Issue: {issue.Title}",
                    fieldChanges: fieldChanges,
                    details: "Issue details updated"
                );
            }

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

            // Log issue deletion
            await _activityLogService.LogActivityAsync(
                userId: issue.ReporterId,
                entityType: "Issue",
                entityId: issue.Id,
                actionType: "Deleted",
                details: $"Issue '{issue.Title}' was deleted"
            );

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

            // Handle AssigneeId search: Assuming searchDto.AssigneeId is a string
            if (!string.IsNullOrWhiteSpace(searchDto.AssigneeId))
            {
                if (int.TryParse(searchDto.AssigneeId, out int parsedAssigneeId)) // [1, 2, 3]
                {
                    query = query.Where(i => i.AssigneeId == parsedAssigneeId.ToString());
                }
                // If parsing fails, the filter is simply not applied for AssigneeId.
            }

            // Handle ReporterId search: Assuming searchDto.ReporterId is a string
            if (!string.IsNullOrWhiteSpace(searchDto.ReporterId))
            {
                if (int.TryParse(searchDto.ReporterId, out int parsedReporterId)) // [1, 2, 3]
                {
                    query = query.Where(i => i.ReporterId == parsedReporterId.ToString());
                }
                // If parsing fails, the filter is simply not applied for ReporterId.
            }

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
