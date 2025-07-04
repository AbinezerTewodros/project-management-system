using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
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

            project.CreateUser = currentUser;
            project.CreatedDate = now;

            project.UpdateUser = currentUser;  // set UpdateUser as same user
            project.UpdatedDate = now;         // set updated time on create too

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            var projectAssignment = new ProjectAssignment
            {
                ProjectId = project.Id,
                MemberId = currentUser,
                MemberRole = "Project Manager", // Or Role = "Project Manager" if you're using the new Role property
                CreatedDate = now,
                CreateUser = currentUser
            };
            _context.ProjectAssignments.Add(projectAssignment);
            await _context.SaveChangesAsync();

            return _mapper.Map<ProjectDto>(project);
        }


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
    }

}
