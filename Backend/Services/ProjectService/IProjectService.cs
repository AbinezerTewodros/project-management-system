using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public interface IProjectService
    {
        Task<List<ProjectDto>> GetAllAsync(string userDept);
        Task<ProjectDto> GetByIdAsync(int id);
        Task<ProjectDto> CreateAsync(CreateProjectDto dto, string currentUser);
        Task<bool> UpdateAsync(int id, UpdateProjectDto dto, string currentUser);
        Task<bool> DeleteAsync(int id);
        Task ArchiveProjectAsync(int projectId, string currentUser);
        Task RestoreProjectAsync(int projectId, string currentUser);
        Task<List<ProjectDto>> GetAllVisibleAsync(string currentUserId);
    }

}
