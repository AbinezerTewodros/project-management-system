using AutoMapper;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Model.Entities;

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
            // Assignment identification
            Id = a.Id,
            ProjectId = a.ProjectId,
            ProjectName = a.Project?.ProjectName,
            
            // User identification fields - both UUID and Employee ID
            MemberId = a.MemberId,  // UUID from Users table
            EmployeeId = a.Member?.EmployeeId,  // Employee ID (EMP123 format)
            MemberFullName = a.Member?.FullName,
            MemberEmail = a.Member?.Email,
            MemberPhone = a.Member?.PhoneNumber,
            MemberDepartment = a.Member?.Department,
            
            // Assignment details
            MemberRole = a.MemberRole,
            Role = a.Role,
            Status = (double)a.Status,
            
            // Audit fields
            CreatedDate = a.CreatedDate,
            UpdatedDate = a.UpdatedDate,
            CreateUser = a.CreateUser,
            UpdateUser = a.UpdateUser
        }).ToList();
    }

    public async Task<List<UserProjectDto>> GetProjectsByEmployeeIdAsync(string employeeId, string requesterDept)
    {
        // Enhanced: Accept both Employee ID and UUID
        // Try to find user by Employee ID first
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        
        // If not found and the input looks like a UUID, try finding by User ID
        if (user == null && Guid.TryParse(employeeId, out var userId))
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.ToString());
        }
        
        if (user == null)
            throw new ArgumentException("No user found with that Employee ID or User ID.");

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
            .Include(pa => pa.Member)  // Include member info
            .Where(pa => pa.MemberId == user.Id)
            .ToListAsync();

        var result = assignments.Select(a => new UserProjectDto
        {
            // Assignment identification
            AssignmentId = a.Id,  // CRITICAL: Unique identifier for approve/reject
            
            // Project information
            ProjectId = a.ProjectId,
            ProjectName = a.Project.ProjectName,
            Priority = a.Project.Priority,
            DueDate = (DateTime)a.Project.DueDate,
            ProjectStatus = a.Project.Status,  // ✅ FIXED: Project approval status
            
            // Assignment details
            MemberRole = a.MemberRole,
            MemberProgress = (double)a.Status,  // Progress percentage (0-100)
            AssignmentStatus = a.Status.ToString(),  // ✅ NEW: Assignment acceptance status (Pending/Approved/Rejected)
            
            // User information (for "Assigned To" column)
            MemberFullName = a.Member?.FullName,
            MemberEmail = a.Member?.Email,
            
            // Audit information (for "Assigned By" column)
            CreateUser = a.CreateUser,
            CreatedDate = a.CreatedDate
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
        assignment.AssignmentAcceptedDate = DateTime.UtcNow;
        
        // Update assignment start date if not already set
        if (assignment.AssignmentStartDate == null)
        {
            assignment.AssignmentStartDate = DateTime.UtcNow;
        }

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

    public async Task<List<AssignmentDto>> GetPendingAssignmentsForUserAsync(string userId)
    {
        var assignments = await _context.ProjectAssignments
            .Include(a => a.Project)
            .Include(a => a.Member)
            .Where(a => a.MemberId == userId && a.Status == AssignmentStatus.Pending)
            .ToListAsync();

        return assignments.Select(a => new AssignmentDto
        {
            Id = a.Id,
            ProjectId = a.ProjectId,
            ProjectName = a.Project?.ProjectName,
            MemberId = a.MemberId,
            EmployeeId = a.Member?.EmployeeId,
            MemberFullName = a.Member?.FullName,
            MemberEmail = a.Member?.Email,
            MemberPhone = a.Member?.PhoneNumber,
            MemberDepartment = a.Member?.Department,
            MemberRole = a.MemberRole,
            Role = a.Role,
            Status = (double)a.Status,
            CreatedDate = a.CreatedDate,
            UpdatedDate = a.UpdatedDate,
            CreateUser = a.CreateUser,
            UpdateUser = a.UpdateUser
        }).ToList();
    }
}
