using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.TimelineDto;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.TimelineService
{
    public class TimelineService : ITimelineService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TimelineService> _logger;

        public TimelineService(AppDbContext context, ILogger<TimelineService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<List<TimelineDto>> GetTimelineByProject(int projectId)
        {
            var timelines = new List<TimelineDto>();

            // Fetch Projects
            var projects = await _context.Projects
                .Where(p => p.Id == projectId)
                .Select(p => new TimelineDto
                {
                    Id = p.Id,
                    Title = p.ProjectName,
                    StartDate = p.StartDate ?? DateTime.UtcNow,
                    DueDate = p.DueDate,
                    CompletedDate = p.CompletedDate,
                    Description = p.Description,
                    TimelineType = "Project",
                    Color = "#007bff",
                    RedirectUrl = $"/Projects/Details/{p.Id}",
                    ProjectId = p.Id,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                }).ToListAsync();
            timelines.AddRange(projects);

            // Fetch ProjectTasks
            var projectTasks = await _context.ProjectTasks
                .Where(pt => pt.ProjectAssignment.ProjectId == projectId)
                .Include(pt => pt.ProjectAssignment)
                .Select(pt => new TimelineDto
                {
                    Id = pt.Id,
                    Title = pt.Title,
                    StartDate = pt.StartDate ?? DateTime.UtcNow,
                    DueDate = pt.DueDate,
                    CompletedDate = pt.CompletedDate,
                    Description = pt.Description,
                    TimelineType = "ProjectTask",
                    Color = "#7fffd4",
                    RedirectUrl = $"/ProjectTasks/Details/{pt.Id}",
                    ProjectId = pt.ProjectAssignment.ProjectId,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                }).ToListAsync();
            timelines.AddRange(projectTasks);

            // Fetch Milestones
            var milestones = await _context.Milestones
                .Where(m => m.ProjectId == projectId)
                .Select(m => new TimelineDto
                {
                    Id = m.MilestoneId,
                    Title = m.MilestoneName,
                    StartDate = m.StartDate,
                    DueDate = m.DueDate,
                    CompletedDate = m.CompletedDate,
                    Description = m.Description,
                    TimelineType = "Milestone",
                    Color = "#5f9ea0",
                    RedirectUrl = $"/Milestones/Details/{m.MilestoneId}",
                    ProjectId = m.ProjectId,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                }).ToListAsync();
            timelines.AddRange(milestones);

            // In the persistedEvents section of GetTimelineByProject method:
            var persistedEvents = await _context.Timelines
                .Include(t => t.Phases)
                .Where(t => t.ProjectId == projectId)
                .Select(t => new TimelineDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    StartDate = t.StartDate,
                    DueDate = t.DueDate,
                    CompletedDate = t.CompletedDate,
                    EventTime = t.EventTime ?? t.CreatedAt,
                    Status = t.Status,
                    TimelineType = t.TimelineType,
                    EventType = t.EventType,
                    Priority = t.Priority,
                    Progress = t.Progress ?? 0,
                    RedirectUrl = t.RedirectUrl,
                    ProjectId = t.ProjectId,
                    Color = t.Color,
                    UserId = t.UserId,
                    LeadTime = t.LeadTime,
                    CycleTime = t.CycleTime,
                    RequestVerificationDate = t.RequestVerificationDate,
                    FeasibilityTestDate = t.FeasibilityTestDate,
                    Phases = t.Phases.Select(p => new TimelinePhaseDto
                    {
                        Id = p.Id,
                        PhaseName = p.PhaseName,
                        // TaktTime = p.TaktTime, // COMMENTED OUT
                        Duration = p.Duration,
                        PhaseStartDate = p.PhaseStartDate,
                        PhaseEndDate = p.PhaseEndDate,
                        PhaseStatus = p.PhaseStatus,
                        Order = p.Order
                    }).ToList()
                }).ToListAsync();
            timelines.AddRange(persistedEvents);

            // Fetch ActivityLogs
            var activityLogs = await _context.ActivityLogs
                .Where(al => al.EntityType == "Project" && al.EntityId == projectId)
                .Include(al => al.FieldChanges)
                .Select(al => new TimelineDto
                {
                    Id = al.Id,
                    Title = $"Activity: {al.ActionType}",
                    Description = string.Join("; ", al.FieldChanges.Select(fc => $"{fc.FieldName} changed from {fc.OldValue} to {fc.NewValue}")),
                    EventTime = al.Timestamp,
                    TimelineType = "ActivityLog",
                    EventType = al.ActionType,
                    Status = "Completed",
                    Color = "#ffc107",
                    RedirectUrl = $"/ActivityLogs/Details/{al.Id}",
                    ProjectId = projectId,
                    UserId = al.UserId
                }).ToListAsync();
            timelines.AddRange(activityLogs);

            // Fetch Comments (related to project tasks only)
            var comments = await _context.Comments
                .Where(c => _context.ProjectTasks.Any(pt => pt.Id == c.TaskId && pt.ProjectAssignment.ProjectId == projectId))
                .Select(c => new TimelineDto
                {
                    Id = c.Id,
                    Title = "Comment Added",
                    Description = c.Content,
                    EventTime = c.CreatedAt,
                    TimelineType = "Comment",
                    EventType = "Added",
                    Status = "Posted",
                    Color = "#17a2b8",
                    RedirectUrl = $"/Comments/Details/{c.Id}",
                    ProjectId = projectId,
                    UserId = c.MemberId
                }).ToListAsync();
            timelines.AddRange(comments);

            // Fetch Notifications (using RelatedEntityType and RelatedEntityId)
            var notifications = await _context.Notifications
                .Where(n => n.RelatedEntityType == "Project" && n.RelatedEntityId == projectId)
                .Select(n => new TimelineDto
                {
                    Id = n.Id,
                    Title = $"Notification: {n.Subject}",
                    Description = n.Message,
                    EventTime = n.CreatedAt,
                    TimelineType = "Notification",
                    EventType = "Notification",
                    Status = n.Status.ToString(),
                    Color = "#dc3545",
                    RedirectUrl = $"/Notifications/Details/{n.Id}",
                    ProjectId = projectId,
                    UserId = n.RecipientUserId
                }).ToListAsync();
            timelines.AddRange(notifications);

            // Fetch Escalations
            var escalations = await _context.Escalations
                .Where(e => e.ProjectId == projectId)
                .Select(e => new TimelineDto
                {
                    Id = e.Id,
                    Title = $"Escalation: {e.Title}",
                    Description = e.Content,
                    EventTime = e.TimeSent,
                    TimelineType = "Escalation",
                    EventType = "Raised",
                    Status = e.Status.ToString(),
                    Color = "#fd7e14",
                    RedirectUrl = $"/Escalations/Details/{e.Id}",
                    ProjectId = projectId,
                    UserId = e.SenderId
                }).ToListAsync();
            timelines.AddRange(escalations);

            // Fetch Messages
            var messages = await _context.Messages
                .Where(m => m.ProjectId == projectId)
                .Select(m => new TimelineDto
                {
                    Id = m.MessageId,
                    Title = "Message Sent",
                    Description = m.Content,
                    EventTime = m.TimeSent,
                    TimelineType = "Message",
                    EventType = "Sent",
                    Status = "Delivered",
                    Color = "#28a745",
                    RedirectUrl = $"/Messages/Details/{m.MessageId}",
                    ProjectId = projectId,
                    UserId = m.SenderId
                }).ToListAsync();
            timelines.AddRange(messages);

            // Sort chronologically (descending by event date)
            timelines = timelines.OrderByDescending(t => t.EventTime ?? t.StartDate ?? DateTime.UtcNow).ToList();

            return timelines;
        }

        public async Task<List<TimelineDto>> GetTimelineByProjectTask(int projectTaskId)
        {
            var timelines = new List<TimelineDto>();

            // Fetch the main ProjectTask
            var mainTask = await _context.ProjectTasks
                .Include(pt => pt.ProjectAssignment)
                .FirstOrDefaultAsync(pt => pt.Id == projectTaskId);

            if (mainTask != null)
            {
                timelines.Add(new TimelineDto
                {
                    Id = mainTask.Id,
                    Title = mainTask.Title,
                    StartDate = mainTask.StartDate ?? DateTime.UtcNow,
                    DueDate = mainTask.DueDate,
                    CompletedDate = mainTask.CompletedDate,
                    Description = mainTask.Description,
                    TimelineType = "ProjectTask",
                    Color = "#7fffd4",
                    RedirectUrl = $"/ProjectTasks/Details/{mainTask.Id}",
                    ProjectId = mainTask.ProjectAssignment.ProjectId,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                });

                // Fetch direct SubTasks
                var subTasks = await _context.ProjectTasks
                    .Where(pt => pt.ParentTaskId == projectTaskId)
                    .Include(pt => pt.ProjectAssignment)
                    .Select(pt => new TimelineDto
                    {
                        Id = pt.Id,
                        Title = pt.Title,
                        StartDate = pt.StartDate ?? DateTime.UtcNow,
                        DueDate = pt.DueDate,
                        CompletedDate = pt.CompletedDate,
                        Description = pt.Description,
                        TimelineType = "ProjectSubTask",
                        Color = "#7fffd4",
                        RedirectUrl = $"/ProjectTasks/Details/{pt.Id}",
                        ProjectId = pt.ProjectAssignment.ProjectId,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    }).ToListAsync();
                timelines.AddRange(subTasks);
            }

            return timelines;
        }

        public async Task<List<TimelineDto>> GetTimelineByMilestone(int milestoneId)
        {
            var timelines = new List<TimelineDto>();

            // Fetch the Milestone
            var milestone = await _context.Milestones
                .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId);

            if (milestone != null)
            {
                timelines.Add(new TimelineDto
                {
                    Id = milestone.MilestoneId,
                    Title = milestone.MilestoneName,
                    StartDate = milestone.StartDate,
                    DueDate = milestone.DueDate,
                    CompletedDate = milestone.CompletedDate,
                    Description = milestone.Description,
                    TimelineType = "Milestone",
                    Color = "#5f9ea0",
                    RedirectUrl = $"/Milestones/Details/{milestone.MilestoneId}",
                    ProjectId = milestone.ProjectId,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                });

                // Fetch related ProjectTasks
                var milestoneTasks = await _context.ProjectTasks
                    .Where(pt => pt.MilestoneId == milestoneId)
                    .Include(pt => pt.ProjectAssignment)
                    .Select(pt => new TimelineDto
                    {
                        Id = pt.Id,
                        Title = pt.Title,
                        StartDate = pt.StartDate ?? DateTime.UtcNow,
                        DueDate = pt.DueDate,
                        CompletedDate = pt.CompletedDate,
                        Description = pt.Description,
                        TimelineType = "ProjectTask",
                        Color = "#7fffd4",
                        RedirectUrl = $"/ProjectTasks/Details/{pt.Id}",
                        ProjectId = pt.ProjectAssignment.ProjectId,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    }).ToListAsync();
                timelines.AddRange(milestoneTasks);
            }

            return timelines;
        }

        public async Task LogTaskStatusChange(int taskId, string oldStatus, string newStatus, string currentUserId)
        {
            var task = await _context.ProjectTasks
                .Include(pt => pt.ProjectAssignment)
                .FirstOrDefaultAsync(pt => pt.Id == taskId);

            if (task == null)
                throw new ArgumentException($"Task with ID {taskId} not found");

            var timelineEvent = new Timeline
            {
                Title = $"Status changed for Task {task.Title}",
                Description = $"Status updated from {oldStatus} to {newStatus}",
                EventTime = DateTime.UtcNow,
                EventType = "StatusChange",
                TimelineType = "ProjectTask",
                ProjectId = task.ProjectAssignment.ProjectId,
                TaskId = task.Id,
                UserId = currentUserId,
                Status = newStatus,
                Color = "#ffcc00"
            };

            _context.Timelines.Add(timelineEvent);
            await _context.SaveChangesAsync();
        }

        public async Task<List<TimelineDto>> GetTimelineByIndependentTask(int independentTaskId)
        {
            var timelines = new List<TimelineDto>();

            // Fetch the IndependentTask
            var independentTask = await _context.IndependentTasks
                .FirstOrDefaultAsync(it => it.TaskId == independentTaskId);

            if (independentTask != null)
            {
                timelines.Add(new TimelineDto
                {
                    Id = independentTask.TaskId,
                    Title = independentTask.Title,
                    StartDate = independentTask.StartDate ?? DateTime.UtcNow,
                    DueDate = independentTask.DueDate,
                    CompletedDate = independentTask.CompletedDate,
                    Description = independentTask.Description,
                    TimelineType = "IndependentTask",
                    Color = "#8a2be2",
                    RedirectUrl = $"/IndependentTasks/Details/{independentTask.TaskId}",
                    ProjectId = 0,
                    Status = "Not Started",
                    Priority = null,
                    Progress = 0
                });
            }

            return timelines;
        }

        public async Task<TimelineDto> AddDependencies(int timelineId, AddDependenciesDto dependencyData)
        {
            if (dependencyData == null || dependencyData.DependencyIds == null)
                throw new ArgumentNullException(nameof(dependencyData));

            // Check if timelineId corresponds to a valid entity
            var timeline = await _context.Timelines.FindAsync(timelineId);
            if (timeline == null)
            {
                // Check other entities if Timeline not found
                var project = await _context.Projects.FindAsync(timelineId);
                var projectTask = await _context.ProjectTasks
                    .Include(pt => pt.ProjectAssignment)
                    .FirstOrDefaultAsync(pt => pt.Id == timelineId);
                var independentTask = await _context.IndependentTasks.FindAsync(timelineId);
                var milestone = await _context.Milestones.FindAsync(timelineId);

                if (project == null && projectTask == null && independentTask == null && milestone == null)
                    return null;

                // Map to TimelineDto based on found entity
                TimelineDto timelineDto = null;
                if (project != null)
                {
                    timelineDto = new TimelineDto
                    {
                        Id = project.Id,
                        Title = project.ProjectName,
                        StartDate = project.StartDate ?? DateTime.UtcNow,
                        DueDate = project.DueDate,
                        CompletedDate = project.CompletedDate,
                        Description = project.Description,
                        TimelineType = "Project",
                        Color = "#007bff",
                        RedirectUrl = $"/Projects/Details/{project.Id}",
                        ProjectId = project.Id,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    };
                }
                else if (projectTask != null)
                {
                    timelineDto = new TimelineDto
                    {
                        Id = projectTask.Id,
                        Title = projectTask.Title,
                        StartDate = projectTask.StartDate ?? DateTime.UtcNow,
                        DueDate = projectTask.DueDate,
                        CompletedDate = projectTask.CompletedDate,
                        Description = projectTask.Description,
                        TimelineType = "ProjectTask",
                        Color = "#7fffd4",
                        RedirectUrl = $"/ProjectTasks/Details/{projectTask.Id}",
                        ProjectId = projectTask.ProjectAssignment.ProjectId,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    };
                }
                else if (independentTask != null)
                {
                    timelineDto = new TimelineDto
                    {
                        Id = independentTask.TaskId,
                        Title = independentTask.Title,
                        StartDate = independentTask.StartDate ?? DateTime.UtcNow,
                        DueDate = independentTask.DueDate,
                        CompletedDate = independentTask.CompletedDate,
                        Description = independentTask.Description,
                        TimelineType = "IndependentTask",
                        Color = "#8a2be2",
                        RedirectUrl = $"/IndependentTasks/Details/{independentTask.TaskId}",
                        ProjectId = 0,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    };
                }
                else if (milestone != null)
                {
                    timelineDto = new TimelineDto
                    {
                        Id = milestone.MilestoneId,
                        Title = milestone.MilestoneName,
                        StartDate = milestone.StartDate,
                        DueDate = milestone.DueDate,
                        CompletedDate = milestone.CompletedDate,
                        Description = milestone.Description,
                        TimelineType = "Milestone",
                        Color = "#5f9ea0",
                        RedirectUrl = $"/Milestones/Details/{milestone.MilestoneId}",
                        ProjectId = milestone.ProjectId,
                        Status = "Not Started",
                        Priority = null,
                        Progress = 0
                    };
                }

                // Add dependencies
                foreach (var depId in dependencyData.DependencyIds)
                {
                    // Validate dependency ID exists
                    var depExists = await _context.Timelines.AnyAsync(t => t.Id == depId) ||
                                   await _context.Projects.AnyAsync(p => p.Id == depId) ||
                                   await _context.ProjectTasks.AnyAsync(pt => pt.Id == depId) ||
                                   await _context.IndependentTasks.AnyAsync(it => it.TaskId == depId) ||
                                   await _context.Milestones.AnyAsync(m => m.MilestoneId == depId);
                    if (!depExists)
                        throw new ArgumentException($"Dependency ID {depId} not found");

                    //_context.TimelineDependencies.Add(new TimelineDependency
                    //{
                    //    TimelineId = timelineId,
                    //    DependencyId = depId,
                    //    Type = dependencyData.TimelineDependencyType
                    //});
                }

                await _context.SaveChangesAsync();
                return timelineDto;
            }

            // If Timeline entity exists
            foreach (var depId in dependencyData.DependencyIds)
            {
                // Validate dependency ID exists
                var depExists = await _context.Timelines.AnyAsync(t => t.Id == depId) ||
                               await _context.Projects.AnyAsync(p => p.Id == depId) ||
                               await _context.ProjectTasks.AnyAsync(pt => pt.Id == depId) ||
                               await _context.IndependentTasks.AnyAsync(it => it.TaskId == depId) ||
                               await _context.Milestones.AnyAsync(m => m.MilestoneId == depId);
                if (!depExists)
                    throw new ArgumentException($"Dependency ID {depId} not found");

                //_context.TimelineDependencies.Add(new TimelineDependency
                //{
                //    TimelineId = timelineId,
                //    DependencyId = depId,
                //    Type = dependencyData.TimelineDependencyType
                //});
            }

            await _context.SaveChangesAsync();

            // Return TimelineDto
            return new TimelineDto
            {
                Id = timeline.Id,
                Title = timeline.Title,
                StartDate = timeline.StartDate,
                DueDate = timeline.DueDate,
                CompletedDate = timeline.CompletedDate,
                Description = timeline.Description,
                TimelineType = timeline.TimelineType,
                Color = timeline.Color,
                RedirectUrl = timeline.RedirectUrl,
                ProjectId = timeline.ProjectId,
                Status = timeline.Status,
                Priority = timeline.Priority,
                Progress = timeline.Progress ?? 0
            };
        }

        public async Task<TimelineDto> UpdateTimelineTimes(int timelineId, UpdateTimelineTimesDto timeData)
        {
            var timeline = await _context.Timelines
                .Include(t => t.Phases)
                .FirstOrDefaultAsync(t => t.Id == timelineId);
            if (timeline == null)
            {
                _logger.LogWarning("Timeline ID {TimelineId} not found in Timelines for UpdateTimelineTimes", timelineId);
                return null;
            }

            try
            {
                if (timeData.RequestVerificationDate.HasValue)
                    timeline.RequestVerificationDate = timeData.RequestVerificationDate.Value;

                if (timeData.FeasibilityTestDate.HasValue)
                    timeline.FeasibilityTestDate = timeData.FeasibilityTestDate.Value;

                if (timeData.ProjectStartDate.HasValue)
                    timeline.StartDate = timeData.ProjectStartDate.Value;

                if (timeData.ProjectCompletionDate.HasValue)
                    timeline.CompletedDate = timeData.ProjectCompletionDate.Value;

                // Calculate LeadTime (from request verification to project start)
                if (timeline.RequestVerificationDate != DateTime.MinValue && timeline.StartDate != DateTime.MinValue)
                    timeline.LeadTime = timeline.StartDate - timeline.RequestVerificationDate;
                else
                    timeline.LeadTime = null; // TimeSpan? is nullable

                // Calculate CycleTime (from feasibility test to project completion)
                if (timeline.FeasibilityTestDate != DateTime.MinValue && timeline.CompletedDate != DateTime.MinValue)
                    timeline.CycleTime = timeline.CompletedDate - timeline.FeasibilityTestDate;
                else
                    timeline.CycleTime = null; // TimeSpan? is nullable

                // Validate ProjectId
                if (timeline.ProjectId != 0 && !await _context.Projects.AnyAsync(p => p.Id == timeline.ProjectId))
                {
                    _logger.LogError("Project ID {ProjectId} not found for Timeline ID {TimelineId}", timeline.ProjectId, timelineId);
                    throw new InvalidOperationException($"Project ID {timeline.ProjectId} not found");
                }

                timeline.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("Updating Timeline ID {TimelineId} with data: {@TimeData}", timelineId, timeData);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully saved Timeline ID {TimelineId}", timelineId);

                return await GetTimelineWithPhases(timeline);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Failed to save Timeline ID {TimelineId}: {ErrorMessage}", timelineId, ex.InnerException?.Message ?? ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating Timeline ID {TimelineId}: {ErrorMessage}", timelineId, ex.Message);
                throw;
            }
        }

        public async Task<List<TimelineDto>> GetTimelineEventsByFilters(int? projectId = null, DateTime? startDate = null,
    DateTime? endDate = null, string userId = null)
        {
            var allTimelines = new List<TimelineDto>();

            // 1. Fetch from Timelines table
            var timelineQuery = _context.Timelines
                .Include(t => t.Phases)
                // REMOVE: .Include(t => t.User) // Comment out if User navigation doesn't exist
                .Include(t => t.Project)
                .AsQueryable();

            // Apply filters for Timelines
            if (projectId.HasValue)
                timelineQuery = timelineQuery.Where(t => t.ProjectId == projectId.Value);

            if (startDate.HasValue)
                timelineQuery = timelineQuery.Where(t => t.EventTime >= startDate.Value || t.StartDate >= startDate.Value);

            if (endDate.HasValue)
                timelineQuery = timelineQuery.Where(t => t.EventTime <= endDate.Value || t.StartDate <= endDate.Value);

            if (!string.IsNullOrEmpty(userId))
                timelineQuery = timelineQuery.Where(t => t.UserId == userId);

            var timelines = await timelineQuery
                .OrderByDescending(t => t.EventTime ?? t.StartDate)
                .Select(t => new TimelineDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    StartDate = t.StartDate,
                    DueDate = t.DueDate,
                    CompletedDate = t.CompletedDate,
                    EventTime = t.EventTime ?? t.CreatedAt,
                    Status = t.Status,
                    TimelineType = t.TimelineType,
                    EventType = t.EventType,
                    Priority = t.Priority,
                    Progress = t.Progress ?? 0,
                    RedirectUrl = t.RedirectUrl,
                    ProjectId = t.ProjectId,
                    Color = t.Color,
                    UserId = t.UserId,
                    LeadTime = t.LeadTime,
                    CycleTime = t.CycleTime,
                    RequestVerificationDate = t.RequestVerificationDate,
                    FeasibilityTestDate = t.FeasibilityTestDate,
                    Phases = t.Phases.Select(p => new TimelinePhaseDto
                    {
                        Id = p.Id,
                        PhaseName = p.PhaseName,
                        Duration = p.Duration,
                        PhaseStartDate = p.PhaseStartDate,
                        PhaseEndDate = p.PhaseEndDate,
                        PhaseStatus = p.PhaseStatus,
                        Order = p.Order
                    }).ToList()
                }).ToListAsync();

            allTimelines.AddRange(timelines);

            // 2. Fetch from ActivityLogs table with the same filters
            var activityLogQuery = _context.ActivityLogs
                .Include(al => al.FieldChanges)
                // REMOVE: .Include(al => al.User) // Comment out if User navigation doesn't exist
                .AsQueryable();

            // Apply filters for ActivityLogs
            if (projectId.HasValue)
                activityLogQuery = activityLogQuery.Where(al => al.EntityType == "Project" && al.EntityId == projectId.Value);

            if (startDate.HasValue)
                activityLogQuery = activityLogQuery.Where(al => al.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                activityLogQuery = activityLogQuery.Where(al => al.Timestamp <= endDate.Value);

            if (!string.IsNullOrEmpty(userId))
                activityLogQuery = activityLogQuery.Where(al => al.UserId == userId);

            var activityLogs = await activityLogQuery
                .OrderByDescending(al => al.Timestamp)
                .Select(al => new TimelineDto
                {
                    Id = al.Id,
                    Title = $"Activity: {al.ActionType}",
                    Description = string.Join("; ", al.FieldChanges.Select(fc => $"{fc.FieldName} changed from {fc.OldValue} to {fc.NewValue}")),
                    EventTime = al.Timestamp,
                    TimelineType = "ActivityLog",
                    EventType = al.ActionType,
                    Status = "Completed",
                    Color = "#ffc107",
                    RedirectUrl = $"/ActivityLogs/Details/{al.Id}",
                    ProjectId = al.EntityType == "Project" ? al.EntityId : null,
                    UserId = al.UserId
                }).ToListAsync();

            allTimelines.AddRange(activityLogs);

            // 3. Fetch from Comments table with the same filters
            var commentQuery = _context.Comments
                // REMOVE: .Include(c => c.Member) // Comment out if Member navigation doesn't exist
                .AsQueryable();

            if (projectId.HasValue)
            {
                commentQuery = commentQuery.Where(c =>
                    _context.ProjectTasks.Any(pt =>
                        pt.Id == c.TaskId &&
                        pt.ProjectAssignment.ProjectId == projectId.Value));
            }

            if (startDate.HasValue)
                commentQuery = commentQuery.Where(c => c.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                commentQuery = commentQuery.Where(c => c.CreatedAt <= endDate.Value);

            if (!string.IsNullOrEmpty(userId))
                commentQuery = commentQuery.Where(c => c.MemberId == userId);

            var comments = await commentQuery
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TimelineDto
                {
                    Id = c.Id,
                    Title = "Comment Added",
                    Description = c.Content,
                    EventTime = c.CreatedAt,
                    TimelineType = "Comment",
                    EventType = "Added",
                    Status = "Posted",
                    Color = "#17a2b8",
                    RedirectUrl = $"/Comments/Details/{c.Id}",
                    ProjectId = projectId,
                    UserId = c.MemberId
                }).ToListAsync();

            allTimelines.AddRange(comments);

            // 4. Fetch from Notifications table with the same filters
            var notificationQuery = _context.Notifications
                .AsQueryable();

            if (projectId.HasValue)
                notificationQuery = notificationQuery.Where(n => n.RelatedEntityType == "Project" && n.RelatedEntityId == projectId.Value);

            if (startDate.HasValue)
                notificationQuery = notificationQuery.Where(n => n.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                notificationQuery = notificationQuery.Where(n => n.CreatedAt <= endDate.Value);

            if (!string.IsNullOrEmpty(userId))
                notificationQuery = notificationQuery.Where(n => n.RecipientUserId == userId);

            var notifications = await notificationQuery
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new TimelineDto
                {
                    Id = n.Id,
                    Title = $"Notification: {n.Subject}",
                    Description = n.Message,
                    EventTime = n.CreatedAt,
                    TimelineType = "Notification",
                    EventType = "Notification",
                    Status = n.Status.ToString(),
                    Color = "#dc3545",
                    RedirectUrl = $"/Notifications/Details/{n.Id}",
                    ProjectId = n.RelatedEntityType == "Project" ? n.RelatedEntityId : null,
                    UserId = n.RecipientUserId
                }).ToListAsync();

            allTimelines.AddRange(notifications);

            // Sort all events chronologically (descending by event date)
            return allTimelines.OrderByDescending(t => t.EventTime ?? t.StartDate ?? DateTime.UtcNow).ToList();
        }

        public async Task<List<TimelinePhaseDto>> GetTimelinePhases(int timelineId)
        {
            return await _context.TimelinePhases
                .Where(p => p.TimelineId == timelineId)
                .OrderBy(p => p.Order)
                .Select(p => new TimelinePhaseDto
                {
                    Id = p.Id,
                    PhaseName = p.PhaseName,
                    Duration = p.Duration,
                    PhaseStartDate = p.PhaseStartDate,
                    PhaseEndDate = p.PhaseEndDate,
                    PhaseStatus = p.PhaseStatus,
                    Order = p.Order
                })
                .ToListAsync();
        }

        public async Task<TimelineDto> AddPhaseToTimeline(int timelineId, TimelinePhaseDto phaseDto)
        {
            var timeline = await _context.Timelines
                .Include(t => t.Phases)
                .FirstOrDefaultAsync(t => t.Id == timelineId);

            if (timeline == null)
            {
                _logger.LogWarning("Timeline ID {TimelineId} not found in Timelines", timelineId);
                return null;
            }

            var phase = new TimelinePhase
            {
                PhaseName = phaseDto.PhaseName,
                Duration = phaseDto.Duration,
                // TaktTime = phaseDto.TaktTime ?? TimeSpan.Zero, // COMMENTED OUT
                PhaseStartDate = phaseDto.PhaseStartDate,
                PhaseEndDate = phaseDto.PhaseEndDate,
                PhaseStatus = phaseDto.PhaseStatus ?? "NotStarted",
                TimelineId = timelineId,
                Order = phaseDto.Order ?? (timeline.Phases.Any() ? (timeline.Phases.Max(p => p.Order ?? 0) + 1) : 1)
            };

            _context.TimelinePhases.Add(phase);
            await _context.SaveChangesAsync();

            return await GetTimelineWithPhases(timeline);
        }

        public async Task<TimelineDto> UpdatePhase(int timelineId, int phaseId, UpdatePhaseDto phaseDto)
        {
            var phase = await _context.TimelinePhases
                .FirstOrDefaultAsync(p => p.Id == phaseId && p.TimelineId == timelineId);

            if (phase == null)
                return null;

            phase.PhaseName = phaseDto.PhaseName;
            phase.PhaseStartDate = phaseDto.PhaseStartDate;
            phase.PhaseEndDate = phaseDto.PhaseEndDate;
            phase.PhaseStatus = phaseDto.PhaseStatus ?? phase.PhaseStatus;

            // COMMENTED OUT: Takt time calculation
            /*
            // Calculate takt time if both dates are provided
            if (phase.PhaseStartDate.HasValue && phase.PhaseEndDate.HasValue)
            {
                phase.TaktTime = phase.PhaseEndDate.Value - phase.PhaseStartDate.Value;
            }
            */

            await _context.SaveChangesAsync();

            var timeline = await _context.Timelines
                .Include(t => t.Phases)
                .FirstOrDefaultAsync(t => t.Id == timelineId);

            return await GetTimelineWithPhases(timeline);
        }

        //public async Task<List<TimelinePhaseDto>> GetTimelinePhases(int timelineId)
        //{
        //    return await _context.TimelinePhases
        //        .Where(p => p.TimelineId == timelineId)
        //        .OrderBy(p => p.Order)
        //        .Select(p => new TimelinePhaseDto
        //        {
        //            Id = p.Id,
        //            PhaseName = p.PhaseName,
        //            Duration = p.Duration,
        //            TaktTime = p.TaktTime,
        //            PhaseStartDate = p.PhaseStartDate,
        //            PhaseEndDate = p.PhaseEndDate,
        //            PhaseStatus = p.PhaseStatus,
        //            Order = p.Order
        //        })
        //        .ToListAsync();
        //}

        //public async Task<TimeAnalysisDto> GetTimeAnalysis(int timelineId)
        //{
        //    var timeline = await _context.Timelines
        //        .Include(t => t.Phases)
        //        .FirstOrDefaultAsync(t => t.Id == timelineId);

        //    if (timeline == null)
        //    {
        //        _logger.LogWarning("Timeline ID {TimelineId} not found in Timelines", timelineId);
        //        return null;
        //    }

        //    var completedPhases = timeline.Phases.Where(p => p.PhaseStatus == "Completed").ToList();
        //    var totalTaktTime = completedPhases.Sum(p => p.TaktTime.TotalHours);
        //    var averageTaktTime = completedPhases.Any() ? completedPhases.Average(p => p.TaktTime.TotalHours) : 0;

        //    var phaseAnalysis = completedPhases.Select(p => new TimelinePhaseAnalysisDto
        //    {
        //        PhaseName = p.PhaseName,
        //        Duration = p.TaktTime,
        //        PercentageOfTotal = totalTaktTime > 0 ? (p.TaktTime.TotalHours / totalTaktTime) * 100 : 0,
        //        IsBottleneck = p.TaktTime == completedPhases.Max(p2 => p2.TaktTime)
        //    }).ToList();

        //    return new TimeAnalysisDto
        //    {
        //        TimelineId = timelineId,
        //        Title = timeline.Title,
        //        LeadTime = timeline.LeadTime,
        //        CycleTime = timeline.CycleTime,
        //        TotalTaktTime = TimeSpan.FromHours(totalTaktTime),
        //        AverageTaktTime = TimeSpan.FromHours(averageTaktTime),
        //        CompletedPhasesCount = completedPhases.Count,
        //        TotalPhasesCount = timeline.Phases.Count,
        //        EfficiencyScore = timeline.Phases.Any() ? ((double)completedPhases.Count / timeline.Phases.Count) * 100 : 0,
        //        EfficiencyPercentage = timeline.Phases.Any() ? ((double)completedPhases.Count / timeline.Phases.Count) * 100 : 0,
        //        PhaseAnalysis = phaseAnalysis
        //    };
        //}

        private async Task<TimelineDto> GetTimelineWithPhases(Timeline timeline)
        {
            var phases = await _context.TimelinePhases
                .Where(p => p.TimelineId == timeline.Id)
                .OrderBy(p => p.Order)
                .Select(p => new TimelinePhaseDto
                {
                    Id = p.Id,
                    PhaseName = p.PhaseName,
                    // TaktTime = p.TaktTime, // COMMENTED OUT
                    PhaseStartDate = p.PhaseStartDate,
                    PhaseEndDate = p.PhaseEndDate,
                    PhaseStatus = p.PhaseStatus,
                    Order = p.Order
                })
                .ToListAsync();

            return new TimelineDto
            {
                Id = timeline.Id,
                Title = timeline.Title,
                StartDate = timeline.StartDate,
                DueDate = timeline.DueDate,
                CompletedDate = timeline.CompletedDate,
                Description = timeline.Description,
                TimelineType = timeline.TimelineType,
                Color = timeline.Color,
                RedirectUrl = timeline.RedirectUrl,
                ProjectId = timeline.ProjectId,
                Status = timeline.Status,
                Priority = timeline.Priority,
                Progress = timeline.Progress ?? 0,
                EventTime = timeline.EventTime,
                EventType = timeline.EventType,
                UserId = timeline.UserId,
                LeadTime = timeline.LeadTime,
                CycleTime = timeline.CycleTime,
                RequestVerificationDate = timeline.RequestVerificationDate,
                FeasibilityTestDate = timeline.FeasibilityTestDate,
                Phases = phases
            };
        }
    }
}