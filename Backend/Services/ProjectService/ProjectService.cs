using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.AccessControl;
using Microsoft.AspNetCore.Identity;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IProjectAssignmentService _projectAssignmentService;
        private readonly IProjectApprovalService _projectApprovalService;
        private readonly IActivityLogService _activityLogService;
        private readonly IAccessControlService _accessControlService;
        private readonly UserManager<ApplicationUser> _userManager;


        public ProjectService(AppDbContext context, IMapper mapper, IProjectAssignmentService projectAssignmentService, IProjectApprovalService projectApprovalService, IActivityLogService activityLogService, IAccessControlService accessControlService, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _mapper = mapper;
            _projectAssignmentService = projectAssignmentService;
            _projectApprovalService = projectApprovalService;
            _activityLogService = activityLogService;
            _accessControlService = accessControlService;
            _userManager = userManager;
        }

        public async Task<List<ProjectDto>> GetAllAsync(string department)
        {
            var projects = await _context.Projects.Where(p => p.Department == department).ToListAsync();
            return _mapper.Map<List<ProjectDto>>(projects);
        }

        public async Task<ProjectDto> GetByIdAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            return _mapper.Map<ProjectDto>(project);
        }

        public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, string currentUser)
        {
            var project = _mapper.Map<Project>(dto);
            var now = DateTime.UtcNow;

            // Set project metadata
            project.CreateUser = currentUser;
            project.CreatedByUserId = currentUser;
            project.CreatedDate = now;
            project.UpdateUser = currentUser;
            project.UpdatedDate = now;

            // Phase 2A: Handle approval workflow
            if (await _projectApprovalService.IsUserManagerOrAboveAsync(currentUser))
            {
                // Manager or above - auto approve
                project.ApprovalStatus = ProjectApprovalStatus.AutoApproved;
                project.Status = "Active";
            }
            else
            {
                // Regular user - needs approval
                project.ApprovalStatus = ProjectApprovalStatus.Pending;
                project.Status = "Pending Approval";
            }

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Log project creation
            await _activityLogService.LogActivityAsync(
                userId: currentUser,
                entityType: "Project",
                entityId: project.Id,
                actionType: "Created",
                details: $"Project '{project.ProjectName}' created in {project.Department} department with status {project.Status}"
            );

            // Resolve current user object
            var currentUserEntity = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUser);
            if (currentUserEntity == null)
                throw new ArgumentException("Creator user not found.");

            ProjectAssignment projectAssignment;

            // 🧠 Logic for assignment
            if (!string.IsNullOrWhiteSpace(dto.AssignedEmployeeId) && !string.IsNullOrWhiteSpace(dto.AssignedRole))
            {
                var assignedUser = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == dto.AssignedEmployeeId);
                if (assignedUser == null)
                    throw new ArgumentException("Assigned employee not found.");

                // Allow multiple scrum masters for enterprise projects
                // Removed restriction - projects can now have multiple scrum masters

                projectAssignment = new ProjectAssignment
                {
                    ProjectId = project.Id,
                    MemberId = assignedUser.Id,
                    MemberRole = dto.AssignedRole,
                    CreateUser = currentUser,
                    CreatedDate = now
                };
            }
            else
            {
                // 👤 Default: assign creator as ScrumMaster
                projectAssignment = new ProjectAssignment
                {
                    ProjectId = project.Id,
                    MemberId = currentUserEntity.Id,
                    MemberRole = "ScrumMaster",
                    CreateUser = currentUser,
                    CreatedDate = now
                };
            }

            _context.ProjectAssignments.Add(projectAssignment);
            await _context.SaveChangesAsync();

            return _mapper.Map<ProjectDto>(project);
        }

        //public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, string currentUser)
        //{
        //    var project = _mapper.Map<Project>(dto);

        //    var now = DateTime.UtcNow;

        //    project.CreateUser = currentUser;
        //    project.CreatedDate = now;

        //    project.UpdateUser = currentUser;  // set UpdateUser as same user
        //    project.UpdatedDate = now;         // set updated time on create too

        //    _context.Projects.Add(project);
        //    await _context.SaveChangesAsync();

        //    var projectAssignment = new ProjectAssignment
        //    {
        //        ProjectId = project.Id,
        //        MemberId = currentUser,
        //        MemberRole = "Project Manager", // Or Role = "Project Manager" if you're using the new Role property
        //        CreatedDate = now,
        //        CreateUser = currentUser
        //    };
        //    _context.ProjectAssignments.Add(projectAssignment);
        //    await _context.SaveChangesAsync();

        //    return _mapper.Map<ProjectDto>(project);
        //}


        public async Task<bool> UpdateAsync(int id, UpdateProjectDto dto, string currentUser)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            // Store old values for logging
            var oldProjectName = project.ProjectName;
            var oldStatus = project.Status;
            var oldPriority = project.Priority;
            var oldDescription = project.Description;

            _mapper.Map(dto, project);
            project.UpdateUser = currentUser;
            project.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log project update with field changes
            var fieldChanges = new List<FieldChange>();
            
            if (oldProjectName != project.ProjectName)
                fieldChanges.Add(new FieldChange { FieldName = "ProjectName", OldValue = oldProjectName, NewValue = project.ProjectName, FieldType = "string" });
            
            if (oldStatus != project.Status)
                fieldChanges.Add(new FieldChange { FieldName = "Status", OldValue = oldStatus, NewValue = project.Status, FieldType = "string" });
            
            if (oldPriority != project.Priority)
                fieldChanges.Add(new FieldChange { FieldName = "Priority", OldValue = oldPriority, NewValue = project.Priority, FieldType = "string" });
            
            if (oldDescription != project.Description)
                fieldChanges.Add(new FieldChange { FieldName = "Description", OldValue = oldDescription, NewValue = project.Description, FieldType = "string" });

            if (fieldChanges.Any())
            {
                await _activityLogService.LogActivityWithFieldChangesAsync(
                    userId: currentUser,
                    entityType: "Project",
                    entityId: project.Id,
                    actionType: "Updated",
                    entityName: $"Project: {project.ProjectName}",
                    fieldChanges: fieldChanges,
                    details: "Project details updated"
                );
            }

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            var projectName = project.ProjectName;
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            // Log project deletion
            await _activityLogService.LogActivityAsync(
                userId: project.UpdateUser ?? project.CreateUser,
                entityType: "Project",
                entityId: id,
                actionType: "Deleted",
                details: $"Project '{projectName}' was deleted"
            );

            return true;
        }

        public async Task ArchiveProjectAsync(int projectId, string currentUser)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new Exception("Project not found");

            project.IsArchived = true;
            project.ArchiveDate = DateTime.UtcNow;
            project.UpdatedDate = DateTime.UtcNow;
            project.UpdateUser = currentUser;

            await _context.SaveChangesAsync();

            // Log project archival
            await _activityLogService.LogActivityAsync(
                userId: currentUser,
                entityType: "Project",
                entityId: project.Id,
                actionType: "Archived",
                details: $"Project '{project.ProjectName}' was archived"
            );
        }
        public async Task<List<ProjectDto>> GetActiveProjectsAsync()
        {
            return await _context.Projects
                .Where(p => !p.IsArchived)
                .Select(p => new ProjectDto
                {
                    Id = p.Id,
                    ProjectName = p.ProjectName,           
                    Description = p.Description,
                    ProjectOwner = p.ProjectOwner,      
                    Priority = p.Priority,
                    Status = p.Status,
                }).ToListAsync();
        }

        public async Task RestoreProjectAsync(int projectId, string currentUser)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new Exception("Project not found");

            if (!project.IsArchived)
                throw new InvalidOperationException("Project is not archived");

            project.IsArchived = false;
            project.ArchiveDate = null;
            project.UpdatedDate = DateTime.UtcNow;
            project.UpdateUser = currentUser;

            await _context.SaveChangesAsync();

            // Log project restoration
            await _activityLogService.LogActivityAsync(
                userId: currentUser,
                entityType: "Project",
                entityId: project.Id,
                actionType: "Restored",
                details: $"Project '{project.ProjectName}' was restored from archive"
            );
        }

        public async Task<List<ProjectDto>> GetAllVisibleAsync(string currentUserId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            if (user == null) return new List<ProjectDto>();

            var roles = await _userManager.GetRolesAsync(user);

            var baseQuery = _context.Projects
                .Include(p => p.ProjectAssignments)
                .AsQueryable();

            var filtered = await _accessControlService.FilterProjectsForUserAsync(baseQuery, user, roles);
            var list = await filtered.ToListAsync();
            return _mapper.Map<List<ProjectDto>>(list);
        }

        /// <summary>
        /// ✅ NEW: Calculate project progress based on milestones AND direct tasks
        /// </summary>
        public async Task<double> CalculateProjectProgress(int projectId)
        {
            // Get all milestones for this project
            var milestones = await _context.Milestones
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();

            // ✅ FIX: Get ProjectAssignmentIds first (no navigation property issues)
            var projectAssignmentIds = await _context.ProjectAssignments
                .Where(pa => pa.ProjectId == projectId)
                .Select(pa => pa.Id)
                .ToListAsync();

            // Get all direct tasks (tasks not in any milestone) for this project
            var directTasks = await _context.ProjectTasks
                .Where(t => projectAssignmentIds.Contains(t.ProjectAssignmentId) && t.MilestoneId == null)
                .ToListAsync();

            double totalWeight = 0;
            double weightedProgress = 0;

            Console.WriteLine($"📊 Project {projectId} - Milestones: {milestones.Count}, Direct Tasks: {directTasks.Count}");

            // Calculate milestone contribution
            if (milestones.Any())
            {
                foreach (var milestone in milestones)
                {
                    totalWeight += milestone.Weight;
                    weightedProgress += milestone.Progress * milestone.Weight;
                    Console.WriteLine($"  📌 Milestone '{milestone.MilestoneName}': Weight={milestone.Weight}, Progress={milestone.Progress:F1}%");
                }
            }

            // Calculate direct tasks contribution (tasks without milestones)
            if (directTasks.Any())
            {
                // Each task without milestone gets equal weight
                double taskWeight = 10; // Default weight for tasks
                foreach (var task in directTasks)
                {
                    totalWeight += taskWeight;
                    weightedProgress += task.Progress * taskWeight;
                    Console.WriteLine($"  📝 Task '{task.Title}': Weight={taskWeight}, Progress={task.Progress:F1}%");
                }
            }

            // If no milestones or tasks, return 0
            if (totalWeight == 0)
            {
                Console.WriteLine($"⚠️ Project {projectId} has no milestones or tasks - progress = 0%");
                return 0;
            }

            double progress = (weightedProgress / totalWeight);
            Console.WriteLine($"✅ Project {projectId} progress: {progress:F2}% (Total Weight: {totalWeight}, Weighted Progress: {weightedProgress:F2})");
            
            return progress;
        }

        /// <summary>
        /// ✅ NEW: Update project progress and status in database
        /// </summary>
        public async Task UpdateProjectProgress(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                Console.WriteLine($"⚠️ Project {projectId} not found, cannot update progress");
                return;
            }

            var oldProgress = project.Progress;
            var oldStatus = project.Status;
            var newProgress = await CalculateProjectProgress(projectId);
            
            project.Progress = newProgress;
            project.UpdatedDate = DateTime.UtcNow;

            // ✅ Auto-update project status based on progress
            if (newProgress >= 100 && project.Status != "Completed")
            {
                project.Status = "Completed";
                Console.WriteLine($"✅ Project {projectId} status: {oldStatus} → Completed (100% progress)");
            }
            else if (newProgress > 0 && newProgress < 100 && 
                     (project.Status == "Not Started" || project.Status == "Pending Approval" || project.Status == "Active"))
            {
                project.Status = "In Progress";
                Console.WriteLine($"🔄 Project {projectId} status: {oldStatus} → In Progress ({newProgress:F1}%)");
            }

            await _context.SaveChangesAsync();
            
            Console.WriteLine($"✅ Project {projectId} progress updated: {oldProgress:F1}% → {newProgress:F1}%");
            
            if (project.Status != oldStatus)
            {
                Console.WriteLine($"📝 Project {projectId} status changed: {oldStatus} → {project.Status}");
            }
            else
            {
                Console.WriteLine($"📝 Project {projectId} status unchanged: {project.Status} (Progress: {newProgress:F1}%)");
            }
        }

    }

}
