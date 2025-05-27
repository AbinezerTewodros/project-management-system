using AutoMapper;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;

public class ProjectAssignmentService : IProjectAssignmentService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ProjectAssignmentService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<AssignmentDto>> GetAllByProjectAsync(int projectId, string requesterDept)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null || project.Department != requesterDept)
            throw new UnauthorizedAccessException("Access denied. Department mismatch.");

        var assignments = await _context.ProjectAssignments
            .Include(p => p.Project)
            .Include(m => m.Member)
            .Where(a => a.ProjectId == projectId)
            .ToListAsync();

        return _mapper.Map<List<AssignmentDto>>(assignments);
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
            MemberProgress = a.Status
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
        if (project == null || project.Department != requesterDept)
            throw new UnauthorizedAccessException("Access denied. Department mismatch.");

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
            CreateUser = currentUser,
            CreatedDate = DateTime.UtcNow
        };

        _context.ProjectAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(assignment.Id);
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
