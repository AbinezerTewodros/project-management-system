using AutoMapper;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using static ProjectAssignment;

public class ProjectAssignmentService : IProjectAssignmentService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ProjectAssignmentService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<AssignmentDto>> GetAllByProjectAsync(int projectId)
    {
        //var project = await _context.Projects
        //    .AsNoTracking()
        //    .FirstOrDefaultAsync(p => p.Id == projectId);

        //if (project == null || project.Department != requesterDept)
        //    throw new UnauthorizedAccessException("Access denied. Department mismatch.");

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
        if (user == null || user.Department != requesterDept)
            throw new UnauthorizedAccessException("Access denied. Department mismatch.");

        if (user.EmployeeId != employeeId)
            throw new ArgumentException("No user found with that Employee ID.");

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

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, string currentUser)
    {
        var assigner = await _context.Users.FirstOrDefaultAsync(u => u.UserName == currentUser);
        if (assigner == null)
            throw new UnauthorizedAccessException("Assigning user not found.");

        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException("Project not found.");

        var assignerAssignment = await _context.ProjectAssignments
            .FirstOrDefaultAsync(a => a.ProjectId == dto.ProjectId && a.MemberId == assigner.Id);

        if (assignerAssignment == null)
            throw new UnauthorizedAccessException("You are not a member of this project.");

        string assignerRole = assignerAssignment.MemberRole;

        // Only ScrumMaster or TeamLeader can assign
        if (assignerRole != "ScrumMaster" && assignerRole != "TeamLeader")
            throw new UnauthorizedAccessException("Only ScrumMaster or TeamLeader can assign members.");

        // Find user by EmployeeId
        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == dto.EmployeeId);
        if (user == null)
            throw new ArgumentException("No user found with that Employee ID.");

        // ScrumMaster can add anyone, TeamLeader must match department
        if (assignerRole == "TeamLeader" && user.Department != assigner.Department)
            throw new UnauthorizedAccessException("TeamLeaders can only assign users from their own department.");

        // Prevent duplicate assignment
        bool exists = await _context.ProjectAssignments
            .AnyAsync(p => p.ProjectId == dto.ProjectId && p.MemberId == user.Id);
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
