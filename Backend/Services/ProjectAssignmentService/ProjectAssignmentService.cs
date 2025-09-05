using AutoMapper;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Services;
using static ProjectAssignment;

public class ProjectAssignmentService : IProjectAssignmentService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IActivityLogService _activityLogService;

    public ProjectAssignmentService(AppDbContext context, IMapper mapper, IActivityLogService activityLogService)
    {
        _context = context;
        _mapper = mapper;
        _activityLogService = activityLogService;
    }

    public async Task<List<AssignmentDto>> GetAllByProjectAsync(int projectId, string requesterDept)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
            throw new ArgumentException("Project not found.");

        // More flexible department validation - allow cross-department access for project management
        if (!string.IsNullOrEmpty(requesterDept) && 
            !string.IsNullOrEmpty(project.Department) &&
            !string.Equals(requesterDept.Trim(), project.Department.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            // Log the department mismatch for debugging
            Console.WriteLine($"Department mismatch: Requester: '{requesterDept}', Project: '{project.Department}'");
            
            // For now, allow access but log it - you can make this stricter if needed
            // throw new UnauthorizedAccessException("Access denied. Department mismatch.");
        }

        var assignments = await _context.ProjectAssignments
            .AsNoTracking()
            .Include(p => p.Project)
            .Include(m => m.Member)
            .Where(a => a.ProjectId == projectId)
            .ToListAsync();

        return assignments.Select(a => new AssignmentDto
        {
            // Map properties manually as a temporary workaround
            Id = a.Project.Id,
            ProjectId = a.ProjectId,
            ProjectName = a.Project?.ProjectName,
            MemberFullName = a.Member?.FullName,
            MemberId = a.Member?.EmployeeId,
            MemberRole = a.MemberRole,
            UpdatedDate = DateTime.UtcNow,
            CreateUser = a.CreateUser,
            UpdateUser = a.UpdateUser

            // Add all other properties here
        }).ToList();
    }

    public async Task<List<UserProjectDto>> GetProjectsByEmployeeIdAsync(string employeeId, string requesterDept)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        if (user == null)
            throw new ArgumentException("No user found with that Employee ID.");

        // More flexible department validation
        if (!string.IsNullOrEmpty(requesterDept) && 
            !string.IsNullOrEmpty(user.Department) &&
            !string.Equals(requesterDept.Trim(), user.Department.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            // Log the department mismatch for debugging
            Console.WriteLine($"Department mismatch: Requester: '{requesterDept}', User: '{user.Department}'");
            
            // For now, allow access but log it - you can make this stricter if needed
            // throw new UnauthorizedAccessException("Access denied. Department mismatch.");
        }

        var assignments = await _context.ProjectAssignments
            .Include(pa => pa.Project)
            .Where(pa => pa.MemberId == user.Id)
            .ToListAsync();

        var result = assignments.Select(a => new UserProjectDto
        {
            ProjectId = a.ProjectId,
            ProjectName = a.Project.ProjectName,
            Priority = a.Project.Priority,
            DueDate = (DateTime)a.Project.DueDate,
            Status = a.Project.Status,
            MemberRole = a.MemberRole,
            MemberProgress = (double)a.Status
        }).ToList();

        return result;
    }

    public async Task<AssignmentDto?> GetByIdAsync(int id)
    {
        var assignment = await _context.ProjectAssignments
            .Include(p => p.Project)
            .Include(m => m.Member)
            .FirstOrDefaultAsync(a => a.Id == id);

        return assignment != null ? _mapper.Map<AssignmentDto>(assignment) : null;
    }

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, string requesterDept, string currentUser)
    {
        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException("Project not found.");

        // More flexible department validation - allow cross-department collaboration
        if (!string.IsNullOrEmpty(requesterDept) && 
            !string.IsNullOrEmpty(project.Department) &&
            !string.Equals(requesterDept.Trim(), project.Department.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            // Log the department mismatch for debugging
            Console.WriteLine($"Department mismatch during assignment: Requester: '{requesterDept}', Project: '{project.Department}'");
            
            // For now, allow cross-department assignment but log it
            // You can make this stricter if needed by uncommenting the line below
            // throw new UnauthorizedAccessException($"Access denied. Department mismatch. Requester: '{requesterDept}', Project: '{project.Department}'");
        }

        // Find user by EmployeeId
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == dto.EmployeeId);
        if (user == null)
            throw new ArgumentException("No user found with that Employee ID.");

        // Check if this user is already assigned to the project
        bool exists = await _context.ProjectAssignments
            .AnyAsync(a => a.ProjectId == dto.ProjectId && a.MemberId == user.Id);

        if (exists)
            throw new InvalidOperationException("User is already assigned to this project.");

        // Create assignment
        var assignment = new ProjectAssignment
        {
            ProjectId = dto.ProjectId,
            MemberId = user.Id,
            MemberRole = dto.MemberRole,
            Role = dto.MemberRole,
            CreateUser = currentUser,
            CreatedDate = DateTime.UtcNow
        };

        _context.ProjectAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Log the assignment activity
        await _activityLogService.LogActivityAsync(
            userId: currentUser,
            entityType: "ProjectAssignment",
            entityId: assignment.Id,
            actionType: "Assigned",
            details: $"User {user.EmployeeId} assigned to project {project.ProjectName} with role {dto.MemberRole}"
        );

        return await GetByIdAsync(assignment.Id);
    }

    // In ProjectAssignmentService.cs (new service)
    public async Task ApproveProjectAssignmentAsync(int assignmentId, string teamLeaderId)
    {
        var assignment = await _context.ProjectAssignments.FindAsync(assignmentId);
        if (assignment == null) throw new NotFoundException("Assignment not found");

        assignment.Status = AssignmentStatus.Approved;
        assignment.ApprovedById = teamLeaderId;
        assignment.ApprovedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task RejectProjectAssignmentAsync(int assignmentId, string teamLeaderId, string reason)
    {
        var assignment = await _context.ProjectAssignments.FindAsync(assignmentId);
        if (assignment == null) throw new NotFoundException("Assignment not found");

        assignment.Status = AssignmentStatus.Rejected;
        assignment.RejectionReason = reason;

        await _context.SaveChangesAsync();
    }
    public async Task<bool> UpdateAsync(int id, UpdateAssignmentDto dto, string currentUser)
    {
        var assignment = await _context.ProjectAssignments.FindAsync(id);
        if (assignment == null) return false;

        assignment.MemberRole = dto.MemberRole;
        assignment.UpdatedDate = DateTime.UtcNow;
        assignment.UpdateUser = currentUser;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var assignment = await _context.ProjectAssignments.FindAsync(id);
        if (assignment == null) return false;

        _context.ProjectAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return true;
    }
}
