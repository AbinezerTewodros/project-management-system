using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.EmployeeAvailabilityDto;
using ProjectManagementSystem1.Model.Entities;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

namespace ProjectManagementSystem1.Services.EmployeeAvailabilityService
{
    public class EmployeeAvailabilityService : IEmployeeAvailabilityService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EmployeeAvailabilityService> _logger;

        public EmployeeAvailabilityService(AppDbContext context, ILogger<EmployeeAvailabilityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<EmployeeAvailabilityDto> GetEmployeeAvailabilityAsync(string employeeId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);

            if (user == null)
                throw new ArgumentException("Employee not found");

            // Get active project assignments
            var assignments = await _context.ProjectAssignments
                .Include(pa => pa.Project)
                .Where(pa => pa.MemberId == user.Id && 
                           pa.Project.Status == "Active")
                .ToListAsync();

            // Get active tasks
            var tasks = await _context.ProjectTasks
                .Include(pt => pt.ProjectAssignment)
                .ThenInclude(pa => pa.Project)
                .Where(pt => pt.AssignedMemberId == user.Id && 
                           pt.Status != TaskStatus.Completed)
                .ToListAsync();

            // Get pending todos
            var todos = await _context.TodoItems
                .Where(t => t.AssigneeId == user.Id && 
                          t.Status == TodoItemStatus.Pending)
                .CountAsync();

            var projectWorkloads = assignments.Select(a => new ProjectWorkloadDto
            {
                ProjectId = a.ProjectId,
                ProjectName = a.Project.ProjectName,
                Priority = a.Project.Priority,
                DueDate = a.Project.DueDate,
                TaskCount = tasks.Count(t => t.ProjectAssignment.ProjectId == a.ProjectId),
                CompletedTasks = tasks.Count(t => t.ProjectAssignment.ProjectId == a.ProjectId && 
                                                t.Status == TaskStatus.Completed),
                Role = a.MemberRole
            }).ToList();

            // Calculate progress percentage for each project
            foreach (var project in projectWorkloads)
            {
                project.ProgressPercentage = project.TaskCount > 0 
                    ? (double)project.CompletedTasks / project.TaskCount * 100 
                    : 0;
            }

            // Calculate overall workload percentage
            var totalWeight = tasks.Sum(t => t.Weight);
            var workloadPercentage = Math.Min(totalWeight, 100); // Cap at 100%

            var status = workloadPercentage switch
            {
                < 30 => AvailabilityStatus.Available,
                < 70 => AvailabilityStatus.Busy,
                < 100 => AvailabilityStatus.Overloaded,
                _ => AvailabilityStatus.Unavailable
            };

            return new EmployeeAvailabilityDto
            {
                EmployeeId = employeeId,
                FullName = user.FullName,
                Department = user.Department,
                TotalActiveProjects = assignments.Count,
                TotalActiveTasks = tasks.Count,
                TotalPendingTodos = todos,
                CurrentWorkloadPercentage = workloadPercentage,
                ProjectWorkloads = projectWorkloads,
                Status = status
            };
        }

        public async Task<List<EmployeeWorkloadDto>> GetTeamWorkloadAsync(string managerId)
        {
            var manager = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager == null)
                throw new ArgumentException("Manager not found");

            // Get all employees in the same department
            var teamMembers = await _context.Users
                .Where(u => u.Department == manager.Department && u.Id != managerId)
                .ToListAsync();

            var workloads = new List<EmployeeWorkloadDto>();

            foreach (var member in teamMembers)
            {
                var availability = await GetEmployeeAvailabilityAsync(member.EmployeeId);
                
                workloads.Add(new EmployeeWorkloadDto
                {
                    EmployeeId = member.EmployeeId,
                    FullName = member.FullName,
                    WorkloadPercentage = availability.CurrentWorkloadPercentage,
                    ActiveProjects = availability.TotalActiveProjects,
                    PendingTasks = availability.TotalActiveTasks,
                    Status = availability.Status,
                    NextAvailableDate = await CalculateNextAvailableDate(member.Id)
                });
            }

            return workloads.OrderBy(w => w.WorkloadPercentage).ToList();
        }

        public async Task<bool> ReassignProjectAsync(int projectId, string fromEmployeeId, string toEmployeeId, string managerId)
        {
            var manager = await _context.Users.FindAsync(managerId);
            var fromEmployee = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == fromEmployeeId);
            var toEmployee = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == toEmployeeId);

            if (manager == null || fromEmployee == null || toEmployee == null)
                throw new ArgumentException("Invalid user IDs provided");

            // Verify manager has authority
            if (fromEmployee.Department != manager.Department || toEmployee.Department != manager.Department)
                throw new UnauthorizedAccessException("Manager can only reassign within their department");

            // Get the project assignment
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(pa => pa.ProjectId == projectId && pa.MemberId == fromEmployee.Id);

            if (assignment == null)
                throw new ArgumentException("Project assignment not found");

            // Check if target employee is already assigned to this project
            var existingAssignment = await _context.ProjectAssignments
                .AnyAsync(pa => pa.ProjectId == projectId && pa.MemberId == toEmployee.Id);

            if (existingAssignment)
                throw new InvalidOperationException("Target employee is already assigned to this project");

            // Update the assignment
            assignment.MemberId = toEmployee.Id;
            assignment.UpdatedDate = DateTime.UtcNow;
            assignment.UpdateUser = managerId;

            // Reassign all tasks from this project
            var tasks = await _context.ProjectTasks
                .Where(pt => pt.ProjectAssignment.ProjectId == projectId && 
                           pt.AssignedMemberId == fromEmployee.Id)
                .ToListAsync();

            foreach (var task in tasks)
            {
                task.AssignedMemberId = toEmployee.Id;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Project {projectId} reassigned from {fromEmployeeId} to {toEmployeeId} by manager {managerId}");
            
            return true;
        }

        public async Task<List<EmployeeCapacityDto>> GetAvailableEmployeesForAssignmentAsync(string department, DateTime requiredBy)
        {
            var employees = await _context.Users
                .Where(u => u.Department == department)
                .ToListAsync();

            var availableEmployees = new List<EmployeeCapacityDto>();

            foreach (var employee in employees)
            {
                var availability = await GetEmployeeAvailabilityAsync(employee.EmployeeId);
                
                if (availability.Status == AvailabilityStatus.Available || 
                    availability.Status == AvailabilityStatus.Busy)
                {
                    // Get employee skills
                    var skills = await _context.UserSkills
                        .Include(us => us.Skill)
                        .Where(us => us.UserId == employee.Id)
                        .Select(us => us.Skill.Name)
                        .ToListAsync();

                    availableEmployees.Add(new EmployeeCapacityDto
                    {
                        EmployeeId = employee.EmployeeId,
                        FullName = employee.FullName,
                        Department = employee.Department,
                        AvailableCapacity = 100 - availability.CurrentWorkloadPercentage,
                        Skills = skills,
                        ExperienceLevel = CalculateExperienceLevel(employee.Id),
                        AvailableFrom = DateTime.UtcNow
                    });
                }
            }

            return availableEmployees
                .OrderByDescending(e => e.AvailableCapacity)
                .ThenByDescending(e => e.ExperienceLevel)
                .ToList();
        }

        public async Task<WorkloadSummaryDto> GetEmployeeWorkloadSummaryAsync(string employeeId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);

            if (user == null)
                throw new ArgumentException("Employee not found");

            var tasks = await _context.ProjectTasks
                .Include(pt => pt.ProjectAssignment)
                .ThenInclude(pa => pa.Project)
                .Where(pt => pt.AssignedMemberId == user.Id)
                .ToListAsync();

            var taskBreakdown = tasks.Select(t => new TaskWorkloadDto
            {
                TaskId = t.Id,
                TaskTitle = t.Title,
                ProjectName = t.ProjectAssignment.Project.ProjectName,
                EstimatedHours = t.Weight, // Using weight as estimated hours
                ActualHours = t.ActualHours ?? 0,
                DueDate = t.DueDate,
                IsOverdue = t.DueDate < DateTime.UtcNow && t.Status != TaskStatus.Completed
            }).ToList();

            return new WorkloadSummaryDto
            {
                EmployeeId = employeeId,
                TotalWorkloadHours = taskBreakdown.Sum(t => t.EstimatedHours),
                CompletedHours = taskBreakdown.Where(t => t.ActualHours > 0).Sum(t => t.ActualHours),
                RemainingHours = taskBreakdown.Sum(t => Math.Max(0, t.EstimatedHours - t.ActualHours)),
                OverdueTasksCount = taskBreakdown.Count(t => t.IsOverdue),
                TaskBreakdown = taskBreakdown
            };
        }

        private async Task<DateTime?> CalculateNextAvailableDate(string userId)
        {
            // Simple calculation based on current workload
            // In a real system, this would be more sophisticated
            var currentTasks = await _context.ProjectTasks
                .Where(pt => pt.AssignedMemberId == userId && pt.Status != TaskStatus.Completed)
                .CountAsync();

            if (currentTasks == 0)
                return DateTime.UtcNow;

            // Estimate 1 week per active task (simplified)
            return DateTime.UtcNow.AddDays(currentTasks * 7);
        }

        private int CalculateExperienceLevel(string userId)
        {
            // Calculate based on completed projects and tasks
            var completedProjects = _context.ProjectAssignments
                .Count(pa => pa.MemberId == userId && pa.Project.Status == "Completed");

            var completedTasks = _context.ProjectTasks
                .Count(pt => pt.AssignedMemberId == userId && pt.Status == TaskStatus.Completed);

            // Simple scoring system
            return Math.Min(10, (completedProjects * 2) + (completedTasks / 10));
        }
    }
}
