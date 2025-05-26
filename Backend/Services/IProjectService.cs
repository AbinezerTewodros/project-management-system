using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;

namespace ProjectManagementSystem1.Services
{
    public interface IProjectService
    {
        Task<List<ProjectDto>> GetAllAsync(string userDept);
        Task<ProjectDto> GetByIdAsync(int id);
        Task<ProjectDto> CreateAsync(CreateProjectDto dto, string currentUser);
        Task<bool> UpdateAsync(int id, UpdateProjectDto dto, string currentUser);
        Task<bool> DeleteAsync(int id);
    }

}
