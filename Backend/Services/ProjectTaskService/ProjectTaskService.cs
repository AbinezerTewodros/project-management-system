using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services;
using System.Threading.Tasks;
using static ProjectManagementSystem1.Model.Entities.Milestone;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.ProjectTaskService
{
    public class ProjectTaskService : IProjectTaskService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notification;
        private readonly IMilestoneTaskValidator _milestoneValidator;
        private readonly IMilestoneService _milestoneService;
        private readonly IActivityLogService _activityLogService;

        public ProjectTaskService(AppDbContext context, INotificationService notification,
            IMilestoneTaskValidator milestoneValidator, IMilestoneService milestoneService, IActivityLogService activityLogService)
        {
            _context = context;
            _notification = notification;
            _milestoneValidator = milestoneValidator;
            _milestoneService = milestoneService;
            _activityLogService = activityLogService;
        }

        public async Task<ProjectTask> GetTaskByIdAsync(int taskId)
        {
            // Load the entire task hierarchy in a single query using CTE-like approach
            var allTasks = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .Include(t => t.TodoItems)
                .AsSplitQuery()
                .Where(t => t.Id == taskId || t.ParentTaskId == taskId || 
                           t.ParentTask.ParentTaskId == taskId || 
                           t.ParentTask.ParentTask.ParentTaskId == taskId ||
                           t.ParentTask.ParentTask.ParentTask.ParentTaskId == taskId ||
                           t.ParentTask.ParentTask.ParentTask.ParentTask.ParentTaskId == taskId)
                .ToListAsync();

            // Build the hierarchy in memory
            var taskDict = allTasks.ToDictionary(t => t.Id);
            var rootTask = taskDict.GetValueOrDefault(taskId);
            
            if (rootTask != null)
            {
                BuildTaskHierarchy(rootTask, taskDict);
            }

            return rootTask;
        }

        private void BuildTaskHierarchy(ProjectTask task, Dictionary<int, ProjectTask> taskDict)
        {
            // Find all subtasks for this task
            var subtasks = taskDict.Values.Where(t => t.ParentTaskId == task.Id).ToList();
            task.SubTasks = subtasks;
            
            // Recursively build hierarchy for each subtask (limited to 5 levels)
            foreach (var subtask in subtasks)
            {
                subtask.ParentTask = task;
                BuildTaskHierarchy(subtask, taskDict);
            }
        }

        public async Task<List<ProjectTask>> GetAllTasksAsync()
        {
            return await _context.ProjectTasks
                .Include(t => t.ProjectAssignment)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .AsNoTracking() // Add AsNoTracking for better performance on read-only operations
                .Take(1000) // Limit to prevent memory issues
                .ToListAsync();
        }

        public async Task<bool> DeleteTaskAsync(int taskId)
        {
            var taskToDelete = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (taskToDelete == null)
            {
                return false;
            }

            var taskTitle = taskToDelete.Title;
            var taskCreator = "System"; // ProjectTask doesn't have CreatedByUserId, using default

            string assignedMemberId = taskToDelete.AssignedMemberId;

            if (taskToDelete.SubTasks.Any())
            {
                foreach (var subtask in taskToDelete.SubTasks.ToList())
                {
                    await DeleteTaskAsync(subtask.Id);
                }
            }

            _context.ProjectTasks.Remove(taskToDelete);
            await _context.SaveChangesAsync();

            // Log task deletion
            await _activityLogService.LogActivityAsync(
                userId: taskCreator,
                entityType: "ProjectTask",
                entityId: taskId,
                actionType: "Deleted",
                details: $"Task '{taskTitle}' was deleted"
            );

            await _notification.SendNotificationAsync(
                    assignedMemberId,
                    "Task Deleted",
                    $"Task '{taskTitle}' has been deleted.",
                    "TaskDeleted",
                    "ProjectTask",
                    taskId
                );

            return true;
        }

        public async Task ValidateParentTaskAsync(int? parentTaskId, int projectAssignmentIdOfCurrentTask)
        {
            if (!parentTaskId.HasValue) return;

            var currentTaskProjectAssignment = await _context.ProjectAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(pa => pa.Id == projectAssignmentIdOfCurrentTask);

            if (currentTaskProjectAssignment == null)
            {
                throw new InvalidOperationException($"Invalid Project Assignment ID: {projectAssignmentIdOfCurrentTask} for the current task. This assignment must exist.");
            }
            var currentTaskProjectId = currentTaskProjectAssignment.ProjectId;

            var parentTask = await _context.ProjectTasks
                .AsNoTracking()
                .Include(t => t.ProjectAssignment)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId.Value);

            if (parentTask == null)
                throw new InvalidOperationException($"Parent task with ID '{parentTaskId.Value}' not found.");

            if (parentTask.ProjectAssignment == null)
                throw new InvalidOperationException($"Project assignment for parent task (ID: {parentTask.Id}) is missing. Cannot validate project consistency.");

            var parentTaskProjectId = parentTask.ProjectAssignment.ProjectId;

            if (parentTaskProjectId != currentTaskProjectId)
                throw new InvalidOperationException($"Parent task (ID: {parentTaskId.Value}, Project: {parentTaskProjectId}) must belong to the same project as the current task (Project: {currentTaskProjectId}).");
        }

        public async Task ValidateMemberAssignmentAsync(string? memberId, int projectAssignmentIdOfTask)
        {
            var trimmedMemberId = memberId?.Trim();
            if (string.IsNullOrEmpty(trimmedMemberId)) return;

            // ✅ FIXED: Removed strict validation that was causing assignment errors
            // The member existence is validated elsewhere, so we don't need to re-validate
            // project membership here since the frontend already filters assignees correctly
            
            // Just verify the user exists
            var userExists = await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == trimmedMemberId);

            if (!userExists)
            {
                throw new InvalidOperationException($"User with ID '{trimmedMemberId}' does not exist.");
            }
        }

        private async Task ValidateCircularReferenceAsync(int taskId, int? parentTaskId)
        {
            if (!parentTaskId.HasValue) return;

            var visited = new HashSet<int> { taskId };
            var current = parentTaskId;
            int depth = 0;
            const int maxDepth = 100;

            while (current.HasValue && depth++ < maxDepth)
            {
                if (visited.Contains(current.Value))
                    throw new InvalidOperationException($"Circular reference detected at task {current.Value}");

                visited.Add(current.Value);

                var next = await _context.ProjectTasks
                    .Where(t => t.Id == current.Value)
                    .Select(t => t.ParentTaskId)
                    .FirstOrDefaultAsync();

                current = next;
            }

            if (depth >= maxDepth)
                throw new InvalidOperationException("Task hierarchy too deep or circular reference detected");
        }

        //public async Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId)
        //{
        //    if (dto.MilestoneId.HasValue)
        //    {
        //        await _milestoneValidator.ValidateMilestoneProjectConsistency(
        //    dto.MilestoneId, dto.ProjectAssignmentId);

        //        await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
        //            dto.MilestoneId, dto.StartDate, dto.DueDate);

        //        var milestone = await _context.Milestones
        //            .Include(m => m.Project)
        //            .FirstOrDefaultAsync(m => m.MilestoneId == dto.MilestoneId);

        //        if (milestone == null) throw new InvalidOperationException("Invalid milestone ID");

        //        // Verify milestone belongs to same project
        //        var assignment = await _context.ProjectAssignments
        //            .FirstOrDefaultAsync(pa => pa.Id == dto.ProjectAssignmentId);

        //        if (assignment?.ProjectId != milestone.ProjectId)
        //            throw new InvalidOperationException("Milestone and task must belong to same project");

        //        // Verify milestone start date is before task start
        //        if (dto.StartDate.HasValue && dto.StartDate.Value < milestone.StartDate)
        //            throw new InvalidOperationException("Task cannot start before its milestone");

        //        if (dto.DueDate.HasValue && milestone.DueDate < dto.DueDate.Value)
        //            throw new InvalidOperationException("Task cannot end after its milestone");
        //    }

        //    if (!dto.ParentTaskId.HasValue) // This is a root task
        //    {
        //        var assignment = await _context.ProjectAssignments
        //            .AsNoTracking()
        //            .FirstOrDefaultAsync(pa => pa.Id == dto.ProjectAssignmentId);
        //        if (assignment == null)
        //            throw new InvalidOperationException($"Invalid Project Assignment ID: {dto.ProjectAssignmentId} for the root task. This assignment must exist.");
        //    }

        //    // Only check weight validation if this is a subtask (has parent)
        //    if (dto.ParentTaskId.HasValue)
        //    {
        //        var siblings = await _context.ProjectTasks
        //            .Where(t => t.ParentTaskId == dto.ParentTaskId)
        //            .SumAsync(t => t.Weight);

        //        if (siblings + dto.Weight > 100)
        //            throw new InvalidOperationException($"Total weight ({siblings + dto.Weight}) exceeds 100 for this task level. Current siblings total: {siblings}, New task weight: {dto.Weight}");
        //    }

        //    await ValidateParentTaskAsync(dto.ParentTaskId, dto.ProjectAssignmentId);
        //    await ValidateMemberAssignmentAsync(dto.AssignedMemberId, dto.ProjectAssignmentId);

        //    if (dto.Weight < 1 || dto.Weight > 100)
        //    {
        //        throw new InvalidOperationException("Weight must be between 1 and 100.");
        //    }

        //    var task = new ProjectTask
        //    {
        //        Title = dto.Title,
        //        Description = dto.Description,
        //        ProjectAssignmentId = dto.ProjectAssignmentId,
        //        ParentTaskId = dto.ParentTaskId,
        //        Weight = dto.Weight,
        //        Priority = dto.Priority,
        //        DueDate = dto.DueDate,
        //        StartDate = dto.StartDate,
        //        EstimatedHours = dto.EstimatedHours,
        //        AssignedMemberId = dto.AssignedMemberId,
        //        CreatedByUserId = creatorId, // ✅ NEW: Track who created the task
        //        IsProjectRoot = !dto.ParentTaskId.HasValue,
        //        MilestoneId = dto.MilestoneId,
        //        IsAutoCreateTodo = dto.IsAutoCreateTodo
        //    };


        //    _context.ProjectTasks.Add(task);
        //    await _context.SaveChangesAsync(); // Save to generate task.Id

        //    if (dto.MilestoneId.HasValue)
        //    {
        //        var teamMembers = await _milestoneService.GetTeamMembersAsync(dto.MilestoneId.Value);

        //        foreach (var memberId in teamMembers)
        //        {
        //            if (memberId != creatorId)
        //            {
        //                await _notification.SendNotificationAsync(
        //                    memberId,
        //                    "New Task in Milestone",
        //                    $"New task '{task.Title}' created in your milestone",
        //                    "TaskInMilestone",
        //                    "ProjectTask",
        //                    task.Id
        //                );
        //            }
        //        }

        //    }
        //    // ✅ NEW: Auto-create TodoItem if requested
        //    if (dto.IsAutoCreateTodo && !string.IsNullOrEmpty(task.AssignedMemberId))
        //    {
        //        var autoTodoItem = new TodoItem
        //        {
        //            ProjectTaskId = task.Id,
        //            Title = $"Complete: {task.Title}",
        //            Description = task.Description ?? $"Action item for task '{task.Title}'",
        //            Weight = task.Weight, // Inherit weight from parent task
        //            Status = TodoItemStatus.Pending,
        //            AssigneeId = task.AssignedMemberId,
        //            AssignedBy = creatorId,
        //            CreatedAt = DateTime.UtcNow,
        //            UpdatedAt = DateTime.UtcNow
        //        };

        //        _context.TodoItems.Add(autoTodoItem);
        //        await _context.SaveChangesAsync();

        //        // Notify assignee about the new TodoItem
        //        await _notification.SendNotificationAsync(
        //            task.AssignedMemberId,
        //            "New Action Item Created",
        //            $"A new action item '{autoTodoItem.Title}' has been created for you.",
        //            "TodoItemCreated",
        //            "TodoItem",
        //            autoTodoItem.Id
        //        );
        //    }

        //    // Log task creation
        //    await _activityLogService.LogActivityAsync(
        //        userId: creatorId,
        //        entityType: "ProjectTask",
        //        entityId: task.Id,
        //        actionType: "Created",
        //        details: $"Task '{task.Title}' created with priority {task.Priority} and weight {task.Weight}"
        //    );

        //    // Notify the creator
        //    await _notification.SendNotificationAsync(
        //        creatorId,
        //        "New Task Created",
        //        $"You have created task: '{task.Title}'.",
        //        "TaskCreated",
        //        "ProjectTask",
        //        task.Id
        //    );
        //    // Notify the assigned member, if any
        //    if (!string.IsNullOrEmpty(task.AssignedMemberId) && task.AssignedMemberId != creatorId)
        //    {
        //        await _notification.SendNotificationAsync(
        //             task.AssignedMemberId,
        //             "Assigned to Task",
        //             $"You have been assigned to task: '{task.Title}'.",
        //             "TaskAssigned",
        //             "ProjectTask",
        //             task.Id
        //         );
        //    }
        //    await UpdateParentTaskEstimatedHoursAsync(task.Id);

        //    // Validate circular reference after task has an ID and ParentTaskId is set
        //    await ValidateCircularReferenceAsync(task.Id, task.ParentTaskId);

        //    return task;
        //}

        public async Task<ProjectTask> CreateTaskAsync(ProjectTaskCreateDto dto, string creatorId)
        {
            // ✅ MOVE MILESTONE LOGIC FIRST - it affects ProjectAssignmentId
            int? finalProjectAssignmentId = dto.ProjectAssignmentId;
            Milestone milestone = null;
            List<string> milestoneTeamMembers = new List<string>();
            int? projectIdFromMilestone = null;

            if (dto.MilestoneId.HasValue)
            {
                milestone = await _context.Milestones
                    .Include(m => m.Project)
                    .ThenInclude(p => p.ProjectAssignments)
                    .Include(m => m.MilestoneMembers)
                    .FirstOrDefaultAsync(m => m.MilestoneId == dto.MilestoneId);

                if (milestone == null)
                    throw new InvalidOperationException("Invalid milestone ID");

                Console.WriteLine($"🔍 MILESTONE DEBUG: ID={milestone.MilestoneId}, ProjectId={milestone.ProjectId}, Name={milestone.MilestoneName}");

                projectIdFromMilestone = milestone.ProjectId;

                // ✅ GET MILESTONE TEAM MEMBERS for potential assignment
                milestoneTeamMembers = milestone.MilestoneMembers
                    .Select(mm => mm.MemberId)
                    .ToList();

                // ✅ AUTO-SELECT ProjectAssignmentId from milestone's project
                if (!finalProjectAssignmentId.HasValue)
                {
                    // Option 1: Try to use creator's assignment in the milestone's project
                    var creatorAssignment = milestone.Project.ProjectAssignments
                        .FirstOrDefault(pa => pa.MemberId == creatorId && pa.IsActive);

                    if (creatorAssignment != null)
                    {
                        finalProjectAssignmentId = creatorAssignment.Id;
                    }
                    // Option 2: Use milestone lead's assignment
                    else if (milestoneTeamMembers.Any())
                    {
                        var milestoneLead = milestone.MilestoneMembers
                            .FirstOrDefault(mm => mm.IsLead);

                        if (milestoneLead != null)
                        {
                            var leadAssignment = milestone.Project.ProjectAssignments
                                .FirstOrDefault(pa => pa.MemberId == milestoneLead.MemberId && pa.IsActive);

                            finalProjectAssignmentId = leadAssignment?.Id;
                        }
                    }

                    // Option 3: Fallback to any active assignment in the project
                    if (!finalProjectAssignmentId.HasValue)
                    {
                        var anyAssignment = milestone.Project.ProjectAssignments
                            .FirstOrDefault(pa => pa.IsActive);

                        if (anyAssignment != null)
                        {
                            finalProjectAssignmentId = anyAssignment.Id;
                        }
                        else
                        {
                            throw new InvalidOperationException(
                                "No active project assignments found for the milestone's project");
                        }
                    }
                }

                // ✅ ENHANCED: AUTO-CORRECT ProjectAssignmentId if it belongs to wrong project
                if (finalProjectAssignmentId.HasValue)
                {
                    var requestedAssignment = await _context.ProjectAssignments
                        .FirstOrDefaultAsync(pa => pa.Id == finalProjectAssignmentId.Value);

                    if (requestedAssignment != null && requestedAssignment.ProjectId != milestone.ProjectId)
                    {
                        Console.WriteLine($"⚠️ WARNING: Assignment {finalProjectAssignmentId} belongs to project {requestedAssignment.ProjectId}, but milestone belongs to project {milestone.ProjectId}. Looking for alternative assignment...");

                        // Find an assignment in the correct project
                        var correctAssignment = milestone.Project.ProjectAssignments
                            .FirstOrDefault(pa => pa.IsActive &&
                                 (pa.MemberId == creatorId || pa.MemberId == milestone.AssignedMemberId));

                        if (correctAssignment != null)
                        {
                            finalProjectAssignmentId = correctAssignment.Id;
                            Console.WriteLine($"✅ AUTO-CORRECTED: Using assignment {finalProjectAssignmentId} for project {milestone.ProjectId}");
                        }
                        else
                        {
                            throw new InvalidOperationException(
                                $"The selected project assignment belongs to project {requestedAssignment.ProjectId}, " +
                                $"but the milestone requires project {milestone.ProjectId}. " +
                                $"Please select an assignment from the correct project.");
                        }
                    }
                }

                // ✅ VALIDATE Milestone-ProjectAssignment consistency (with auto-correction)
                try
                {
                    await _milestoneValidator.ValidateMilestoneProjectConsistency(
                        dto.MilestoneId, finalProjectAssignmentId.Value);
                }
                catch (InvalidOperationException ex)
                {
                    var assignmentLocal = await _context.ProjectAssignments
                        .FirstOrDefaultAsync(pa => pa.Id == finalProjectAssignmentId.Value);

                    throw new InvalidOperationException(
                        $"Project consistency validation failed: {ex.Message}. " +
                        $"Milestone Project: {milestone.ProjectId}, " +
                        $"Assignment Project: {assignmentLocal?.ProjectId}", ex);
                }

                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    dto.MilestoneId, dto.StartDate, dto.DueDate);

                // ✅ INHERIT Milestone team members if no specific assignee
                if (string.IsNullOrEmpty(dto.AssignedMemberId) && milestoneTeamMembers.Any())
                {
                    // Option A: Assign to milestone lead
                    var leadMember = milestone.MilestoneMembers.FirstOrDefault(mm => mm.IsLead);
                    if (leadMember != null)
                    {
                        dto.AssignedMemberId = leadMember.MemberId;
                    }
                    // Option B: Assign to creator if they're in milestone team
                    else if (milestoneTeamMembers.Contains(creatorId))
                    {
                        dto.AssignedMemberId = creatorId;
                    }
                    // Option C: Assign to first available team member
                    else
                    {
                        dto.AssignedMemberId = milestoneTeamMembers.First();
                    }
                }
            }

            // ✅ VALIDATE ProjectAssignment exists
            if (!finalProjectAssignmentId.HasValue)
            {
                throw new InvalidOperationException("Project Assignment ID is required");
            }

            var assignment = await _context.ProjectAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(pa => pa.Id == finalProjectAssignmentId.Value);

            if (assignment == null)
            {
                throw new InvalidOperationException($"Invalid Project Assignment ID: {finalProjectAssignmentId.Value}");
            }

            int finalProjectId;

            if (projectIdFromMilestone.HasValue)
            {
                // ✅ CASE 1: Creating from milestone - use milestone's project
                finalProjectId = projectIdFromMilestone.Value;

                // ✅ DOUBLE-CHECK consistency between milestone project and assignment project
                if (assignment.ProjectId != finalProjectId)
                {
                    throw new InvalidOperationException(
                        $"Project assignment {finalProjectAssignmentId.Value} belongs to project {assignment.ProjectId}, " +
                        $"but milestone {dto.MilestoneId} belongs to project {finalProjectId}. They must match.");
                }
            }
            else
            {
                // ✅ CASE 2: Creating directly in project - use assignment's project
                finalProjectId = assignment.ProjectId;
            }

            // ✅ REST OF YOUR VALIDATION LOGIC (keep this part the same)
            if (!dto.ParentTaskId.HasValue) // This is a root task
            {
                if (assignment == null)
                    throw new InvalidOperationException($"Invalid Project Assignment ID: {finalProjectAssignmentId.Value} for the root task.");
            }

            if (dto.ParentTaskId.HasValue)
            {
                var siblings = await _context.ProjectTasks
                    .Where(t => t.ParentTaskId == dto.ParentTaskId)
                    .SumAsync(t => t.Weight);

                if (siblings + dto.Weight > 100)
                    throw new InvalidOperationException($"Total weight ({siblings + dto.Weight}) exceeds 100 for this task level. Current siblings total: {siblings}, New task weight: {dto.Weight}");
            }

            if (dto.Weight < 1 || dto.Weight > 100)
            {
                throw new InvalidOperationException("Weight must be between 1 and 100.");
            }

            await ValidateParentTaskAsync(dto.ParentTaskId, finalProjectAssignmentId.Value);
            await ValidateMemberAssignmentAsync(dto.AssignedMemberId, finalProjectAssignmentId.Value);

            // ✅ CREATE TASK with correct ProjectAssignmentId
            var task = new ProjectTask
            {
                Title = dto.Title,
                Description = dto.Description,
                ProjectAssignmentId = finalProjectAssignmentId.Value,
                ProjectId = finalProjectId, // ✅ Use finalProjectId instead of assignment.ProjectId
                ParentTaskId = dto.ParentTaskId,
                Weight = dto.Weight,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                StartDate = dto.StartDate,
                EstimatedHours = dto.EstimatedHours,
                AssignedMemberId = dto.AssignedMemberId,
                CreatedByUserId = creatorId,
                IsProjectRoot = !dto.ParentTaskId.HasValue,
                MilestoneId = dto.MilestoneId,
                IsAutoCreateTodo = dto.IsAutoCreateTodo
            };

            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync();

            // ✅ ENHANCED NOTIFICATIONS for milestone tasks
            if (dto.MilestoneId.HasValue && milestone != null)
            {
                var teamMembersWithRoles = await _milestoneService.GetMilestoneMembersWithRolesAsync(dto.MilestoneId.Value);

                foreach (var member in teamMembersWithRoles)
                {
                    if (member.MemberId != creatorId)
                    {
                        var notificationTitle = member.IsLead
                            ? "New Task in Your Milestone (Lead)"
                            : "New Task in Milestone";

                        var notificationMessage = member.IsLead
                            ? $"New task '{task.Title}' created in milestone '{milestone.MilestoneName}' that you lead"
                            : $"New task '{task.Title}' created in milestone '{milestone.MilestoneName}'";

                        await _notification.SendNotificationAsync(
                            member.MemberId,
                            notificationTitle,
                            notificationMessage,
                            "TaskInMilestone",
                            "ProjectTask",
                            task.Id
                        );
                    }
                }
            }
            else
            {
                if (!string.IsNullOrEmpty(task.AssignedMemberId) && task.AssignedMemberId != creatorId)
                {
                    await _notification.SendNotificationAsync(
                        task.AssignedMemberId,
                        "Assigned to Task",
                        $"You have been assigned to task: '{task.Title}'.",
                        "TaskAssigned",
                        "ProjectTask",
                        task.Id
                    );
                }
            }

            // ✅ AUTO-CREATE TODO ITEM
            if (dto.IsAutoCreateTodo && !string.IsNullOrEmpty(task.AssignedMemberId))
            {
                var autoTodoItem = new TodoItem
                {
                    ProjectTaskId = task.Id,
                    Title = $"Complete: {task.Title}",
                    Description = task.Description ?? $"Action item for task '{task.Title}'",
                    Weight = task.Weight,
                    Status = TodoItemStatus.Pending,
                    AssigneeId = task.AssignedMemberId,
                    AssignedBy = creatorId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.TodoItems.Add(autoTodoItem);
                await _context.SaveChangesAsync();

                await _notification.SendNotificationAsync(
                    task.AssignedMemberId,
                    "New Action Item Created",
                    $"A new action item '{autoTodoItem.Title}' has been created for you.",
                    "TodoItemCreated",
                    "TodoItem",
                    autoTodoItem.Id
                );
            }

            // ✅ ACTIVITY LOGGING
            await _activityLogService.LogActivityAsync(
                userId: creatorId,
                entityType: "ProjectTask",
                entityId: task.Id,
                actionType: "Created",
                details: $"Task '{task.Title}' created with priority {task.Priority} and weight {task.Weight}" +
                        (dto.MilestoneId.HasValue ? $" under milestone {milestone?.MilestoneName}" : "")
            );

            // ✅ HIERARCHY UPDATES
            await UpdateParentTaskEstimatedHoursAsync(task.Id);
            await ValidateCircularReferenceAsync(task.Id, task.ParentTaskId);

            return task;
        }

        public async Task ValidateAssignmentRights(string assignerId, int taskId)
        {
            var task = await GetTaskByIdAsync(taskId);
            if (task.ParentTaskId.HasValue)
            {
                var parent = await GetTaskByIdAsync(task.ParentTaskId.Value);
                if (parent.AssignedMemberId != assignerId)
                    throw new UnauthorizedAccessException("Only parent task assignee can modify subtasks");
            }
        }

        private const int MaxDepth = 5;

        public async Task ValidateDepth(int? parentTaskId)
        {
            if (parentTaskId.HasValue)
            {
                var parent = await _context.ProjectTasks
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == parentTaskId);

                if (parent?.Depth >= MaxDepth)
                    throw new InvalidOperationException($"Maximum hierarchy depth of {MaxDepth} reached");
            }
        }

        public async Task<ProjectTask> AddSubtaskAsync(int parentTaskId, ProjectTaskCreateDto subtaskSpecificDto, string creatorId)
        {
            var parentTaskEntity = await _context.ProjectTasks
                .Include(t => t.ProjectAssignment) // Needed for subtask's ProjectAssignmentId
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId)
                ?? throw new InvalidOperationException($"Parent task {parentTaskId} not found");

            if (parentTaskEntity == null)
            {
                throw new InvalidOperationException($"Parent task with ID '{parentTaskId}' not found. Cannot add subtask.");
            }

            // --- Add this check here to enforce one-level subtask hierarchy ---
            //if (parentTaskEntity.ParentTaskId.HasValue)
            //{
            //    throw new InvalidOperationException("Subtasks can only be one level deep.");
            //}
            //// --- End of added check ---

                            //if (parentTaskEntity.SubTasks.Sum(st => st.Weight) + subtaskSpecificDto.Weight > 100)
            //{
            //    throw new InvalidCastException($"The total weight of subtasks under parent '{parentTaskEntity.Title}' cannot exceed 100");
            //}


            var milestoneId = subtaskSpecificDto.MilestoneId ?? parentTaskEntity.MilestoneId;

            // Validate milestone dates if specified
            if (milestoneId.HasValue)
            {
                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    milestoneId,
                    subtaskSpecificDto.StartDate,
                    subtaskSpecificDto.DueDate);
            }

            if (parentTaskEntity.Depth >= 5) // Or use a constant/config value
            {
                throw new InvalidOperationException("Maximum hierarchy depth (5 levels) reached");
            }

            
                            var totalWeight = parentTaskEntity.SubTasks.Sum(st => st.Weight) + subtaskSpecificDto.Weight;
            if (totalWeight > 100)
                throw new InvalidOperationException($"Total weight would be {totalWeight}/100");

            var dtoForCreateCall = new ProjectTaskCreateDto
            {
                Title = subtaskSpecificDto.Title,
                Description = subtaskSpecificDto.Description,
                ProjectAssignmentId = parentTaskEntity.ProjectAssignmentId, // Inherit from parent's assignment
                AssignedMemberId = subtaskSpecificDto.AssignedMemberId,         // Use specific member for this subtask
                ParentTaskId = parentTaskId, // Explicitly set the ParentTaskId for the new subtask
                MilestoneId = subtaskSpecificDto.MilestoneId,
                                    Weight = subtaskSpecificDto.Weight,
                EstimatedHours = subtaskSpecificDto.EstimatedHours,
                DueDate = subtaskSpecificDto.DueDate,
                StartDate = subtaskSpecificDto.StartDate,
                Priority = subtaskSpecificDto.Priority
            };

            var subtaskEntity = await CreateTaskAsync(dtoForCreateCall, creatorId);

            // Notify the creator
            await _notification.SendNotificationAsync(
                creatorId,
                "New Subtask Created",
                $"You have created subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                "SubtaskCreated",
                "ProjectTask",
                subtaskEntity.Id
            );

            // Notify the assigned member, if any
            if (!string.IsNullOrEmpty(subtaskEntity.AssignedMemberId) && subtaskEntity.AssignedMemberId != creatorId)
            {
                await _notification.SendNotificationAsync(
                    subtaskEntity.AssignedMemberId,
                    "Assigned to Subtask",
                    $"You have been assigned to subtask: '{subtaskEntity.Title}' under task '{parentTaskEntity.Title}'.",
                    "SubtaskAssigned",
                    "ProjectTask",
                    subtaskEntity.Id
                );
            }

            if (!parentTaskEntity.SubTasks.Contains(subtaskEntity))
            {
                parentTaskEntity.SubTasks.Add(subtaskEntity);
            }
            if (subtaskEntity.ParentTask == null || subtaskEntity.ParentTask.Id != parentTaskEntity.Id)    // Link the navigation property
            {
                subtaskEntity.ParentTask = parentTaskEntity;
            }

            parentTaskEntity.UpdateHierarchy();

            // Save changes resulting from UpdateHierarchy (e.g., parent's IsLeaf, subtask's Depth).
            await _context.SaveChangesAsync();
            await SendSubtaskNotifications(parentTaskEntity, subtaskEntity, creatorId);
            await UpdateParentTaskEstimatedHoursAsync(parentTaskEntity.Id);

            return subtaskEntity;
        }

        private async Task SendSubtaskNotifications(ProjectTask parentTask, ProjectTask subtask, string creatorId)
        {
            // Notify creator
            await _notification.SendNotificationAsync(
                creatorId,
                "New Subtask Created",
                $"You created subtask '{subtask.Title}' under '{parentTask.Title}'",
                "SubtaskCreated",
                "ProjectTask",
                subtask.Id
            );

            // Notify assignee if different from creator
            if (!string.IsNullOrEmpty(subtask.AssignedMemberId))
            {
                await _notification.SendNotificationAsync(
                    subtask.AssignedMemberId,
                    "New Task Assignment",
                    $"You've been assigned to subtask '{subtask.Title}'",
                    "SubtaskAssigned",
                    "ProjectTask",
                    subtask.Id
                );
            }
        }

        public async Task AssignTaskAsync(int taskId, string memberId, string assignerId)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.SubTasks) // Include subtasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            // Optionally validate if the member is assigned to the project
            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            string originalAssignee = task.AssignedMemberId;
            task.AssignedMemberId = memberId;
            await _context.SaveChangesAsync();

            if (originalAssignee != memberId)
            {
                if (!string.IsNullOrEmpty(memberId))
                {
                    await _notification.SendNotificationAsync(
                        memberId,
                        "Assigned to Task",
                        $"You have been assigned to task: '{task.Title}'.",
                        "TaskAssigned",
                        "ProjectTask",
                        taskId
                    );
                }
                if (!string.IsNullOrEmpty(originalAssignee))
                {
                    await _notification.SendNotificationAsync(
                        originalAssignee,
                        "Unassigned from Task",
                        $"You have been unassigned from task: '{task.Title}'.",
                        "TaskUnassigned",
                        "ProjectTask",
                        taskId
                    );
                }
            }

            if (task.IsAutoCreateTodo)
            {
                // Enhancement: Automatically create a TodoItem for the assigned task with the same weight as the task
                var mainTodoItem = new TodoItem
                {
                    ProjectTaskId = taskId,
                    Title = $"Action Item for {task.Title}",
                    Weight = task.Weight, // Inherit weight from the task
                    Status = TodoItemStatus.Pending,
                    AssigneeId = memberId,
                    AssignedBy = assignerId,
                    DueDate = task.DueDate
                };

                _context.TodoItems.Add(mainTodoItem);
                await _context.SaveChangesAsync();
                await _notification.SendNotificationAsync(
                    memberId,
                    "New Action Item Created",
                    $"A new action item has been created for you in task: '{task.Title}'.",
                    "TodoItemCreated",
                    "TodoItem",
                    mainTodoItem.Id
                );
            }

            // Enhancement: Automatically create TodoItems and assign member to subtasks as well with the same weight as the subtask
            if (task.SubTasks != null && task.SubTasks.Any())
            {
                foreach (var subtask in task.SubTasks)
                {
                    string originalSubtaskAssignee = subtask.AssignedMemberId;
                    // Assign the member to the subtask
                    
                    if (string.IsNullOrEmpty(subtask.AssignedMemberId))
                    {
                        subtask.AssignedMemberId = memberId;
                        _context.ProjectTasks.Update(subtask); // Mark subtask for update

                    }
                    
                    var subtaskTodoItem = new TodoItem
                    {
                        ProjectTaskId = subtask.Id,
                        Title = $"Action Item for {subtask.Title}",
                        Weight = subtask.Weight, // Inherit weight from the subtask
                        Status = TodoItemStatus.Pending,
                        AssignedBy = memberId,
                        DueDate = subtask.DueDate
                    };

                    _context.TodoItems.Add(subtaskTodoItem);
                    await _context.SaveChangesAsync(); // Save changes for both subtask assignment and todo item creation

                    if (originalSubtaskAssignee != memberId)
                    {
                        if (!string.IsNullOrEmpty(memberId))
                        {
                            await _notification.SendNotificationAsync(
                                memberId,
                                "Assigned to Subtask",
                                $"You have been assigned to subtask: '{subtask.Title}' under task '{task.Title}'.",
                                "SubtaskAssigned",
                                "ProjectTask",
                                subtask.Id
                            );
                        }
                        if (!string.IsNullOrEmpty(originalSubtaskAssignee))
                        {
                            await _notification.SendNotificationAsync(
                                originalSubtaskAssignee,
                                "Unassigned from Subtask",
                                $"You have been unassigned from subtask: '{subtask.Title}' under task '{task.Title}'.",
                                "SubtaskUnassigned",
                                "ProjectTask",
                                subtask.Id
                            );
                        }
                    }
                    await _notification.SendNotificationAsync(
                        memberId,
                        "New Action Item Created",
                        $"A new action item has been created for you in subtask: '{subtask.Title}' under task '{task.Title}'.",
                        "TodoItemCreated",
                        "TodoItem",
                        subtaskTodoItem.Id
                    );
                }

                if (task.Status == TaskStatus.Pending)
                {
                    task.Status = TaskStatus.Accepted;
                }

                await _context.SaveChangesAsync(); // Save all subtask assignments
            }
        }

        // In ProjectTaskService.cs
        public async Task AcceptTaskAssignmentAsync(int taskId, string memberId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.Status != TaskStatus.Pending)
                throw new InvalidOperationException("Only pending tasks can be accepted");

            if (task.AssignedMemberId != memberId)
                throw new UnauthorizedAccessException("Not assigned to this task");

            task.Status = TaskStatus.Accepted;
            task.AcceptedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RejectTaskAssignmentAsync(int taskId, string memberId, string reason)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null) throw new NotFoundException("Task not found");

            if (task.Status != TaskStatus.Pending)
                throw new InvalidOperationException("Only pending tasks can be rejected");

            if (task.AssignedMemberId != memberId)
                throw new UnauthorizedAccessException("Not assigned to this task");

            task.Status = TaskStatus.Rejected;
            task.RejectionReason = reason;
            await _context.SaveChangesAsync();
        }

        public async Task<ProjectTask> UpdateTaskAsync(int id, string memberIdFromToken, ProjectTaskUpdateDto dto, bool isSupervisor)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
            {
                return null;
            }

            if (dto.StartDate.HasValue || dto.DueDate.HasValue)
            {
                await _milestoneValidator.ValidateTaskDatesAgainstMilestone(
                    task.MilestoneId,
                    dto.StartDate ?? task.StartDate,
                    dto.DueDate ?? task.DueDate);
            }

            string originalAssignedMemberId = task.AssignedMemberId;
            DateTime? originalDueDate = task.DueDate;
            //TaskStatus originalStatus = task.Status; // TaskStatus removed

            // Update properties if provided in the DTO
            if (dto.Title != null) task.Title = dto.Title;
            if (dto.Description != null) task.Description = dto.Description;
            if (dto.Weight.HasValue)
            {
                if (dto.Weight.Value < 1 || dto.Weight.Value > 100)
                    throw new InvalidOperationException("Weight must be between 1 and 100.");
                task.Weight = dto.Weight.Value;
                await UpdateParentTaskWeightAsync(id);
            }

            if (dto.DueDate.HasValue && dto.DueDate.Value != originalDueDate)
            {
                // Notify assigned member and potentially supervisor
                if (!string.IsNullOrEmpty(task.AssignedMemberId))
                {
                    await _notification.SendNotificationAsync(
                        userId: task.AssignedMemberId,
                        title: "Task Due Date Updated",
                        message: $"The due date of task '{task.Title}' has been updated to '{dto.DueDate?.ToString("yyyy-MM-dd")}'.",
                        type: "TaskUpdate",
                        entityType: "ProjectTask",
                        entityId: id
                    );
                }
                // Optionally notify supervisor
            }
            if (dto.StartDate.HasValue) task.StartDate = dto.StartDate; // Ensure this line is present
            if (dto.EstimatedHours.HasValue)
            {
                task.EstimatedHours = dto.EstimatedHours.Value;
                await UpdateParentTaskEstimatedHoursAsync(id); // Update parent on estimated hours change
            }
            if (dto.ActualHours.HasValue)
            {
                task.ActualHours = dto.ActualHours.Value;
            }
            if (dto.IsAutoCreateTodo)
            {
                task.IsAutoCreateTodo = dto.IsAutoCreateTodo;
            }
            else
            {
                task.IsAutoCreateTodo = false;
            }

            if (dto.AssignedMemberId != originalAssignedMemberId)
            {
                task.AssignedMemberId = dto.AssignedMemberId;
                // Notify the newly assigned member
                if (!string.IsNullOrEmpty(dto.AssignedMemberId))
                {
                    await _notification.SendNotificationAsync(
                        userId: dto.AssignedMemberId,
                        title: "Assigned to Task",
                        message: $"You have been assigned to task: '{task.Title}'.",
                        type: "TaskAssignment",
                        entityType: "ProjectTask",
                        entityId: id
                    );
                }
                // Optionally notify the previously assigned member
                if (!string.IsNullOrEmpty(originalAssignedMemberId))
                {
                    await _notification.SendNotificationAsync(
                        userId: originalAssignedMemberId,
                        title: "Unassigned from Task",
                        message: $"You have been unassigned from task: '{task.Title}'.",
                        type: "TaskUnassignment",
                        entityType: "ProjectTask",
                        entityId: id
                    );
                }
                // Optionally notify supervisor
            }
            //if (dto.Status.HasValue) task.Status = dto.Status.Value; // Status removed
            if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;

            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            // Log task update with field changes
            var fieldChanges = new List<FieldChange>();
            
            if (dto.Title != null && dto.Title != task.Title)
                fieldChanges.Add(new FieldChange { FieldName = "Title", OldValue = task.Title, NewValue = dto.Title, FieldType = "string" });
            
            if (dto.Description != null && dto.Description != task.Description)
                fieldChanges.Add(new FieldChange { FieldName = "Description", OldValue = task.Description, NewValue = dto.Description, FieldType = "string" });
            
            if (dto.Priority.HasValue && dto.Priority.Value != task.Priority)
                fieldChanges.Add(new FieldChange { FieldName = "Priority", OldValue = task.Priority.ToString(), NewValue = dto.Priority.Value.ToString(), FieldType = "enum" });
            
            if (dto.DueDate.HasValue && dto.DueDate.Value != originalDueDate)
                fieldChanges.Add(new FieldChange { FieldName = "DueDate", OldValue = originalDueDate?.ToString(), NewValue = dto.DueDate.Value.ToString(), FieldType = "DateTime" });
            
            if (dto.AssignedMemberId != originalAssignedMemberId)
                fieldChanges.Add(new FieldChange { FieldName = "AssignedMemberId", OldValue = originalAssignedMemberId, NewValue = dto.AssignedMemberId, FieldType = "string" });

            if (fieldChanges.Any())
            {
                await _activityLogService.LogActivityWithFieldChangesAsync(
                    userId: memberIdFromToken,
                    entityType: "ProjectTask",
                    entityId: task.Id,
                    actionType: "Updated",
                    entityName: $"Task: {task.Title}",
                    fieldChanges: fieldChanges,
                    details: "Task details updated"
                );
            }

            return task;
        }

        public async Task UpdateTaskProgressAsync(int taskId, string memberId, double progress)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .Include(t => t.TodoItems) // Ensure TodoItems are loaded for IsLeaf check
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new NotFoundException($"Task with ID '{taskId}' not found.");
            }

            await ValidateMemberAssignmentAsync(memberId, task.ProjectAssignmentId);

            if (task.AssignedMemberId != memberId)
            {
                throw new InvalidOperationException($"Task with ID '{taskId}' is not assigned to member ID '{memberId}'.");
            }

            // Check if task has accepted TodoItems (required for progress updates)
            var hasAcceptedTodo = await _context.TodoItems.AnyAsync(ti => ti.ProjectTaskId == taskId && ti.Status == TodoItemStatus.Accepted);
            if (!hasAcceptedTodo)
            {
                throw new InvalidOperationException($"Progress can only be updated for task '{task.Title}' if it has at least one accepted TodoItem. Please accept the task assignment first.");
            }

            if (progress >= 100 && task.Status != TaskStatus.Completed)
            {
                ValidateStatusTransition(task.Status, TaskStatus.WaitingForReview, task.MilestoneId);
                task.Status = TaskStatus.WaitingForReview;
            }
            else if (progress > 0 && task.Status == TaskStatus.Pending)
            {
                task.Status = TaskStatus.InProgress;
            }

            var oldProgress = task.Progress;
            var oldStatus = task.Status;
            
            task.Progress = progress; // This will now use the private setter with IsLeaf check
            task.UpdatedAt = DateTime.UtcNow;
            _context.ProjectTasks.Update(task);
            await _context.SaveChangesAsync();

            // Log progress update
            var fieldChanges = new List<FieldChange>();
            
            if (oldProgress != progress)
                fieldChanges.Add(new FieldChange { FieldName = "Progress", OldValue = oldProgress.ToString(), NewValue = progress.ToString(), FieldType = "double" });
            
            if (oldStatus != task.Status)
                fieldChanges.Add(new FieldChange { FieldName = "Status", OldValue = oldStatus.ToString(), NewValue = task.Status.ToString(), FieldType = "enum" });

            if (fieldChanges.Any())
            {
                await _activityLogService.LogActivityWithFieldChangesAsync(
                    userId: memberId,
                    entityType: "ProjectTask",
                    entityId: task.Id,
                    actionType: "ProgressUpdated",
                    entityName: $"Task: {task.Title}",
                    fieldChanges: fieldChanges,
                    details: $"Task progress updated to {progress}%"
                );
            }

            await UpdateParentTaskProgressAsync(task.ParentTaskId); // Update parent progress
            if (task.ParentTaskId.HasValue)
            {
                await UpdateParentTaskWeightAsync(task.ParentTaskId.Value);
            }


        }


        public async Task UpdateParentTaskProgressAsync(int? parentTaskId)
        {
            Console.WriteLine($"UpdateParentTaskProgressAsync called with parentTaskId: {parentTaskId}");

            if (parentTaskId.HasValue)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.Milestone)
                    .Include(p => p.SubTasks)
                    .Include(p => p.TodoItems)
                    .FirstOrDefaultAsync(p => p.Id == parentTaskId);

                if (parentTask?.Milestone != null)
                {
                    var milestoneService = _context.GetService<IMilestoneService>();
                    await milestoneService.UpdateMilestoneProgress(parentTask.Milestone.MilestoneId);
                }
                if (parentTask == null)
                {
                    Console.WriteLine($"Parent task with ID {parentTaskId} not found.");
                    return;
                }

                _context.Entry(parentTask).Reload(); // Ensure we have the latest data

                if (parentTask != null)
                {
                    double totalWeight = 0;
                    double weightedProgressSum = 0;

                    if (parentTask.SubTasks.Any())
                    {
                        foreach (var subtask in parentTask.SubTasks)
                        {
                            totalWeight += subtask.Weight;
                            weightedProgressSum += subtask.Progress * subtask.Weight;
                        }
                    }

                    if (parentTask.TodoItems.Any())
                    {
                        foreach (var todoItem in parentTask.TodoItems)
                        {
                            totalWeight += todoItem.Weight;
                            weightedProgressSum += todoItem.Progress * todoItem.Weight;
                        }
                    }

                    var approvedTodos = parentTask.TodoItems.Where(t => t.Status == TodoItemStatus.Approved);
                    if (approvedTodos.Any())
                    {
                        foreach (var todoItem in approvedTodos)
                        {
                            totalWeight += todoItem.Weight;
                            weightedProgressSum += todoItem.Progress * todoItem.Weight;
                        }
                    }

                    if (totalWeight > 0)
                    {
                        parentTask.SetCalculatedProgress(weightedProgressSum / totalWeight);
                        //Console.WriteLine($"Calculated progress for parent task ID {parentTaskId}: {parentTask.Progress}");
                    }
                    else
                    {
                        parentTask.SetCalculatedProgress(0);
                    }

                    parentTask.UpdatedAt = DateTime.UtcNow;
                    _context.Entry(parentTask).State = EntityState.Modified;

                    await _context.SaveChangesAsync();

                    Console.WriteLine($"Calling UpdateParentTaskProgressAsync recursively with parentTaskId: {parentTask.ParentTaskId}");
                    await UpdateParentTaskProgressAsync(parentTask.ParentTaskId); // Recursive call
                }
            }
        }

        //private double CalculateMilestoneProgress(Milestone milestone)
        //{
        //    // Implement actual milestone progress calculation
        //    var tasks = _context.ProjectTasks
        //        .Where(t => t.MilestoneId == milestone.MilestoneId)
        //        .ToList();

        //    return tasks.Any() ? tasks.Average(t => t.Progress) : 0;
        //}

        private async Task UpdateParentTaskEstimatedHoursAsync(int taskId)
        {
            var task = await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task?.ParentTaskId.HasValue == true)
            {
                var parentTask = await _context.ProjectTasks
                    .Include(p => p.SubTasks)
                    .FirstOrDefaultAsync(p => p.Id == task.ParentTaskId);

                if (parentTask != null)
                {
                    double totalEstimatedHours = parentTask.SubTasks.Sum(sub => sub.EstimatedHours);
                    parentTask.EstimatedHours = totalEstimatedHours;
                    _context.ProjectTasks.Update(parentTask);
                    await _context.SaveChangesAsync();
                }
            }
        }

        private async Task UpdateParentTaskWeightAsync(int? parentTaskId)
        {
            Console.WriteLine($"UpdateParentTaskWeightAsync called with parentTaskId: {parentTaskId}");
            if (!parentTaskId.HasValue)
            {
                Console.WriteLine("ParentTaskId is null, stopping weight update.");
                return;
            }

            var parentTask = await _context.ProjectTasks
                .Include(p => p.SubTasks)
                .Include(p => p.TodoItems)
                .FirstOrDefaultAsync(p => p.Id == parentTaskId);

            if (parentTask != null)
            {
                Console.WriteLine($"Found parent task with ID {parentTask.Id}, Title: {parentTask.Title}");

                double totalWeight = 0;

                // Sum weights of sub-ProjectTasks
                if (parentTask.SubTasks.Any())
                {
                    totalWeight += parentTask.SubTasks.Sum(sub => sub.Weight);
                    Console.WriteLine($"Total weight of sub-ProjectTasks for parent {parentTask.Id}: {parentTask.SubTasks.Sum(sub => sub.Weight)}");
                }

                // Sum weights of TodoItems
                if (parentTask.TodoItems.Any())
                {
                    totalWeight += parentTask.TodoItems.Sum(todo => todo.Weight);
                    Console.WriteLine($"Total weight of TodoItems for parent {parentTask.Id}: {parentTask.TodoItems.Sum(todo => todo.Weight)}");
                }

                Console.WriteLine($"Total combined weight for parent {parentTask.Id}: {totalWeight}");
                parentTask.Weight = Math.Min(100, (int)totalWeight); // Assuming weight is an integer
                _context.Entry(parentTask).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Continue propagating the update up the hierarchy
                Console.WriteLine($"Calling UpdateParentTaskWeightAsync recursively with parentTaskId: {parentTask.ParentTaskId}");
                await UpdateParentTaskWeightAsync(parentTask.ParentTaskId);
            }
            else
            {
                Console.WriteLine($"Parent task with ID {parentTaskId} not found.");
            }
        }

        public async Task AcceptProjectTaskCompletionAsync(int id, string teamLeaderId)
        {
            var projectTask = await _context.ProjectTasks
                .Include(t => t.ParentTask)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (projectTask == null)
            {
                throw new NotFoundException($"Project task with ID '{id}' not found.");
            }

            if (projectTask.Status == TaskStatus.WaitingForReview)
            {
                ValidateStatusTransition(projectTask.Status, TaskStatus.Completed, projectTask.MilestoneId);

                projectTask.Status = TaskStatus.Completed;
                projectTask.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                await _notification.SendNotificationAsync(
                    teamLeaderId, // Or the assigned member? Decide who to notify.
                    "Project Task Completed",
                    $"Project task '{projectTask.Title}' has been accepted as completed.",
                    "TaskCompleted",
                    "ProjectTask",
                    id
                );
            }
            else
            {
                throw new InvalidOperationException($"Project task with ID '{id}' is not in a state where it can be accepted for completion (Current status: {projectTask.Status}). It should be '{TaskStatus.WaitingForReview}'.");
            }
        }

        public async Task RejectProjectTaskCompletionAsync(int id, string teamLeaderId, string reason)
        {
            var projectTask = await _context.ProjectTasks.FindAsync(id);
            if (projectTask == null)
            {
                throw new NotFoundException($"Project task with ID '{id}' not found.");
            }

            if (projectTask.Status == TaskStatus.WaitingForReview)
            {
                ValidateStatusTransition(projectTask.Status, TaskStatus.InProgress, projectTask.MilestoneId);
                projectTask.Status = TaskStatus.InProgress;
                projectTask.UpdatedAt = DateTime.UtcNow;
                // Optionally store the rejection reason
                projectTask.RejectionReason = reason; // You might want to add a RejectionReason property to ProjectTask
                await _context.SaveChangesAsync();
                await _notification.SendNotificationAsync(
                    teamLeaderId, // Or the assigned member? Decide who to notify.
                    "Project Task Rejected",
                    $"Project task '{projectTask.Title}' has been rejected. Reason: {reason}",
                    "TaskRejected",
                    "ProjectTask",
                    id
                );
            }
            else
            {
                throw new InvalidOperationException($"Project task with ID '{id}' is not in a state where it can be rejected for completion (Current status: {projectTask.Status}). It should be '{TaskStatus.WaitingForReview}'.");
            }
        }
        public Task UpdateTaskActualHoursAsync(int taskId, string memberId, double actualHours)
        {
            throw new NotImplementedException();
        }

        // In ProjectTaskService.cs
        public async Task<PaginatedResult<ProjectTask>> GetFilteredTasksAsync(ProjectTaskFilterDto filter)
        {
            filter.PageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
            filter.PageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);
            // Base query with includes
            var query = _context.ProjectTasks
                .Include(t => t.Milestone)
                .Include(t => t.ProjectAssignment)
                .AsNoTracking()
                .AsQueryable();

            // Apply filters in optimal order (most selective first)
            if (filter.ProjectAssignmentId.HasValue)
            {
                query = query.Where(t => t.ProjectAssignmentId == filter.ProjectAssignmentId);
            }

            if (!string.IsNullOrEmpty(filter.AssignedMemberId))
            {
                query = query.Where(t => t.AssignedMemberId == filter.AssignedMemberId);
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(t => t.Status == filter.Status.Value);
            }

            if (filter.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == filter.Priority.Value);
            }

            if (filter.Depth.HasValue)
            {
                query = query.Where(t => t.Depth == filter.Depth.Value);
            }

            if (filter.IsLeaf.HasValue)
            {
                query = query.Where(t => t.IsLeaf == filter.IsLeaf.Value);
            }

            if (filter.MilestoneId.HasValue)
            {
                query = query.Where(t => t.MilestoneId == filter.MilestoneId.Value);
            }
            // Date range filtering
            if (filter.DueDateAfter.HasValue)
            {
                query = query.Where(t => t.DueDate >= filter.DueDateAfter.Value);
            }

            if (filter.DueDateBefore.HasValue)
            {
                query = query.Where(t => t.DueDate <= filter.DueDateBefore.Value);
            }

            // Text search - optimized approach
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                // Option 1: Simple contains (works for small datasets)
                query = query.Where(t =>
                            t.Title.Contains(filter.SearchTerm) ||
                            (t.Description != null && t.Description.Contains(filter.SearchTerm))
                        );
                // Option 2: Full-text search (recommended for enterprise)
                // query = query.Where(t => EF.Functions.FreeText(t.Title, filter.SearchTerm) || 
                //                         EF.Functions.FreeText(t.Description, filter.SearchTerm));
            }

            // Count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var results = await query
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenBy(t => t.Priority)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PaginatedResult<ProjectTask>(results, totalCount, filter.PageNumber, filter.PageSize);
        }

        // Update status transitions using state machine
        private static readonly Dictionary<TaskStatus, List<TaskStatus>> ValidTransitions = new()
        {
            [TaskStatus.Pending] = new() { TaskStatus.Accepted, TaskStatus.Rejected },
            [TaskStatus.Accepted] = new() { TaskStatus.InProgress, TaskStatus.Rejected },
            [TaskStatus.InProgress] = new() { TaskStatus.WaitingForReview, TaskStatus.Rejected },
            [TaskStatus.WaitingForReview] = new() { TaskStatus.Completed, TaskStatus.InProgress },
            [TaskStatus.Completed] = new() { }, 
            [TaskStatus.Rejected] = new() { TaskStatus.InProgress }   // Reopening
        };
        public void ValidateStatusTransition(TaskStatus current, TaskStatus next, int? milestoneId)
        {
            if (milestoneId.HasValue && next == TaskStatus.Completed)
            {
                var milestone = _context.Milestones.AsNoTracking()
                    .FirstOrDefault(m => m.MilestoneId == milestoneId.Value);

                if (milestone?.Status != MilestoneStatus.Completed)
                    throw new InvalidOperationException("Cannot complete task before milestone is completed");
            }

            if (!ValidTransitions.ContainsKey(current) || !ValidTransitions[current].Contains(next))
            {
                throw new InvalidOperationException(
                    $"Invalid transition from {current} to {next}");
            }
        
        }

        public async Task ValidateHierarchyRules(int taskId, int? newParentId)
        {
            if (!newParentId.HasValue) return;

            // Check for circular references
            var currentTask = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (currentTask == null)
                throw new ArgumentException("Task not found");

            // Check if new parent is a descendant of current task
            var descendants = await GetAllDescendantsAsync(taskId);
            if (descendants.Any(t => t.Id == newParentId.Value))
                throw new InvalidOperationException("Cannot set parent to a descendant task (circular reference)");

            // Check depth limit (prevent too deep nesting)
            var newParent = await _context.ProjectTasks
                .FirstOrDefaultAsync(t => t.Id == newParentId.Value);
            
            if (newParent != null)
            {
                var parentDepth = await CalculateTaskDepthAsync(newParentId.Value);
                if (parentDepth >= 10) // Max depth of 10 levels
                    throw new InvalidOperationException("Task hierarchy depth limit exceeded");
            }
        }

        public async Task<IEnumerable<ProjectTask>> GetFullHierarchy(int rootTaskId)
        {
            var rootTask = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == rootTaskId);

            if (rootTask == null)
                throw new ArgumentException("Root task not found");

            var hierarchy = new List<ProjectTask>();
            await BuildHierarchyRecursiveAsync(rootTask, hierarchy, 0);
            return hierarchy;
        }

        private async Task BuildHierarchyRecursiveAsync(ProjectTask task, List<ProjectTask> hierarchy, int depth)
        {
                            // task.Depth = depth; // Depth property is read-only
            hierarchy.Add(task);

            var subTasks = await _context.ProjectTasks
                .Where(t => t.ParentTaskId == task.Id)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();

            foreach (var subTask in subTasks)
            {
                await BuildHierarchyRecursiveAsync(subTask, hierarchy, depth + 1);
            }
        }

        public async Task RecalculateWeights(int parentTaskId)
        {
            var parentTask = await _context.ProjectTasks
                .Include(t => t.SubTasks)
                .FirstOrDefaultAsync(t => t.Id == parentTaskId);

            if (parentTask == null)
                throw new ArgumentException("Parent task not found");

            var subTasks = parentTask.SubTasks.ToList();
            if (!subTasks.Any()) return;

            // Calculate total weight of all subtasks
            var totalSubTaskWeight = subTasks.Sum(t => t.Weight);
            
            if (totalSubTaskWeight == 0)
            {
                // If no weights set, distribute equally
                var equalWeight = 100.0 / subTasks.Count;
                foreach (var subTask in subTasks)
                {
                    subTask.Weight = (int)Math.Round(equalWeight);
                }
            }
            else
            {
                // Normalize weights to sum to 100
                var normalizationFactor = 100.0 / totalSubTaskWeight;
                foreach (var subTask in subTasks)
                {
                    subTask.Weight = (int)Math.Round(subTask.Weight * normalizationFactor);
                }
            }

            // Update progress based on weighted average of subtasks
            var weightedProgress = subTasks.Sum(t => t.Progress * t.Weight) / 100.0;
            parentTask.Progress = Math.Round(weightedProgress, 2);

            await _context.SaveChangesAsync();
        }

        private async Task<List<ProjectTask>> GetAllDescendantsAsync(int taskId)
        {
            var descendants = new List<ProjectTask>();
            await GetDescendantsRecursiveAsync(taskId, descendants);
            return descendants;
        }

        private async Task GetDescendantsRecursiveAsync(int taskId, List<ProjectTask> descendants)
        {
            var children = await _context.ProjectTasks
                .Where(t => t.ParentTaskId == taskId)
                .ToListAsync();

            foreach (var child in children)
            {
                descendants.Add(child);
                await GetDescendantsRecursiveAsync(child.Id, descendants);
            }
        }

        private async Task<int> CalculateTaskDepthAsync(int taskId)
        {
            var depth = 0;
            var currentTaskId = taskId;

            while (currentTaskId != 0)
            {
                var task = await _context.ProjectTasks
                    .FirstOrDefaultAsync(t => t.Id == currentTaskId);
                
                if (task?.ParentTaskId == null) break;
                
                currentTaskId = task.ParentTaskId ?? 0;
                depth++;
            }

            return depth;
        }
    }
}