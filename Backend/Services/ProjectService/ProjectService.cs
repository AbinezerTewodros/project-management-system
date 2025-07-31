using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IProjectAssignmentService _projectAssignmentService;

        public ProjectService(AppDbContext context, IMapper mapper, IProjectAssignmentService projectAssignmentService)
        {
            _context = context;
            _mapper = mapper;
            _projectAssignmentService = projectAssignmentService;
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
            project.CreatedDate = now;
            project.UpdateUser = currentUser;
            project.UpdatedDate = now;

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

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

                // Check if role is ScrumMaster and already exists
                if (dto.AssignedRole == "ScrumMaster")
                {
                    var exists = await _context.ProjectAssignments
                        .AnyAsync(a => a.ProjectId == project.Id && a.MemberRole == "ScrumMaster");
                    if (exists)
                        throw new InvalidOperationException("Project already has a ScrumMaster.");
                }

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

            _mapper.Map(dto, project);
            project.UpdateUser = currentUser;
            project.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
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
        }



    }

}
