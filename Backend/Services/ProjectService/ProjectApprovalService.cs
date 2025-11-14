using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectDto;
using ProjectManagementSystem1.Model.Entities;
using System.Security.Claims;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public class ProjectApprovalService : IProjectApprovalService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ProjectApprovalService> _logger;

        public ProjectApprovalService(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ProjectApprovalService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<ProjectApprovalResponseDto> ApproveProjectAsync(ProjectApprovalRequestDto request)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                throw new ArgumentException("Project not found");

            if (project.ApprovalStatus != ProjectApprovalStatus.Pending)
                throw new InvalidOperationException("Project is not in pending status");

            // Verify the approver is a manager or above
            if (!await IsUserManagerOrAboveAsync(request.ApproverUserId))
                throw new UnauthorizedAccessException("Only managers and above can approve projects");

            project.ApprovalStatus = ProjectApprovalStatus.Approved;
            project.ApprovedByUserId = request.ApproverUserId;
            project.ApprovalDate = DateTime.UtcNow;
            project.ApprovalNotes = request.Notes;
            project.Status = "Active"; // Activate the project

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Project {project.Id} approved by {request.ApproverUserId}");

            return await GetProjectApprovalStatusAsync(project.Id);
        }

        public async Task<ProjectApprovalResponseDto> RejectProjectAsync(ProjectApprovalRequestDto request)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                throw new ArgumentException("Project not found");

            if (project.ApprovalStatus != ProjectApprovalStatus.Pending)
                throw new InvalidOperationException("Project is not in pending status");

            // Verify the rejector is a manager or above
            if (!await IsUserManagerOrAboveAsync(request.ApproverUserId))
                throw new UnauthorizedAccessException("Only managers and above can reject projects");

            project.ApprovalStatus = ProjectApprovalStatus.Rejected;
            project.ApprovedByUserId = request.ApproverUserId;
            project.ApprovalDate = DateTime.UtcNow;
            project.RejectionReason = request.RejectionReason;
            project.Status = "Rejected";

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Project {project.Id} rejected by {request.ApproverUserId}");

            return await GetProjectApprovalStatusAsync(project.Id);
        }

        public async Task<List<PendingProjectApprovalDto>> GetPendingApprovalsAsync(string managerUserId)
        {
            // Verify the user is a manager or above
            if (!await IsUserManagerOrAboveAsync(managerUserId))
                throw new UnauthorizedAccessException("Only managers and above can view pending approvals");

            // Get the approver's role and department
            var approver = await _userManager.FindByIdAsync(managerUserId);
            if (approver == null)
                throw new ArgumentException("User not found");

            var roles = await _userManager.GetRolesAsync(approver);
            var approverDepartment = approver.Department;

            // ✅ HIERARCHICAL FILTERING:
            // - Executives (Director/VP/President/Admin) see ALL departments
            // - Department Managers see ONLY their department
            bool isExecutive = roles.Any(r => 
                r.Equals("Director", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Vice President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Vice_President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Admin", StringComparison.OrdinalIgnoreCase));

            var pendingProjects = await _context.Projects
                .Where(p => p.ApprovalStatus == ProjectApprovalStatus.Pending &&
                           (isExecutive || p.Department == approverDepartment)) // ✅ Filter by department for managers
                .Select(p => new PendingProjectApprovalDto
                {
                    ProjectId = p.Id,
                    ProjectName = p.ProjectName,
                    Description = p.Description ?? string.Empty,
                    Department = p.Department,
                    ProjectOwner = p.ProjectOwner,
                    CreatedBy = p.CreateUser ?? string.Empty,
                    CreatedDate = p.CreatedDate ?? DateTime.UtcNow,
                    Priority = p.Priority,
                    DueDate = p.DueDate
                })
                .ToListAsync();

            _logger.LogInformation($"User {managerUserId} ({string.Join(",", roles)}) viewing {pendingProjects.Count} pending approvals. IsExecutive: {isExecutive}, Department: {approverDepartment}");

            return pendingProjects;
        }

        public async Task<ProjectApprovalResponseDto> GetProjectApprovalStatusAsync(int projectId)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new ArgumentException("Project not found");

            var createdByUser = await _userManager.FindByIdAsync(project.CreatedByUserId ?? string.Empty);
            var approvedByUser = await _userManager.FindByIdAsync(project.ApprovedByUserId ?? string.Empty);

            return new ProjectApprovalResponseDto
            {
                ProjectId = project.Id,
                ProjectName = project.ProjectName,
                Status = project.ApprovalStatus,
                CreatedBy = createdByUser?.UserName ?? "Unknown",
                ApprovedBy = approvedByUser?.UserName,
                ApprovalDate = project.ApprovalDate,
                Notes = project.ApprovalNotes,
                RejectionReason = project.RejectionReason,
                CreatedDate = project.CreatedDate ?? DateTime.UtcNow
            };
        }

        public async Task<bool> CanUserCreateProjectAsync(string userId)
        {
            // Managers and above can create projects without approval
            if (await IsUserManagerOrAboveAsync(userId))
                return true;

            // Regular users can create projects but need approval
            return true;
        }

        public async Task<bool> IsUserManagerOrAboveAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            var roles = await _userManager.GetRolesAsync(user);
            
            // ✅ CORRECTED: Manager or above includes all management and executive roles
            // Only Members and Supervisors need approval
            return roles.Any(r => 
                r.Equals("Manager", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Director", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Vice President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Vice_President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("President", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        }

        public async Task<List<ProjectApprovalResponseDto>> GetApprovalHistoryAsync(string userId)
        {
            // Verify the user is a manager or above
            if (!await IsUserManagerOrAboveAsync(userId))
                throw new UnauthorizedAccessException("Only managers and above can view approval history");

            var projects = await _context.Projects
                .Where(p => p.ApprovedByUserId == userId && 
                           (p.ApprovalStatus == ProjectApprovalStatus.Approved || 
                            p.ApprovalStatus == ProjectApprovalStatus.Rejected))
                .ToListAsync();

            var result = new List<ProjectApprovalResponseDto>();

            foreach (var project in projects)
            {
                var createdByUser = await _userManager.FindByIdAsync(project.CreatedByUserId ?? string.Empty);
                var approvedByUser = await _userManager.FindByIdAsync(project.ApprovedByUserId ?? string.Empty);

                result.Add(new ProjectApprovalResponseDto
                {
                    ProjectId = project.Id,
                    ProjectName = project.ProjectName,
                    Status = project.ApprovalStatus,
                    CreatedBy = createdByUser?.UserName ?? "Unknown",
                    ApprovedBy = approvedByUser?.UserName,
                    ApprovalDate = project.ApprovalDate,
                    Notes = project.ApprovalNotes,
                    RejectionReason = project.RejectionReason,
                    CreatedDate = project.CreatedDate ?? DateTime.UtcNow
                });
            }

            return result;
        }
    }
}
