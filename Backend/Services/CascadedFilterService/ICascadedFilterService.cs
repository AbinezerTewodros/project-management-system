using ProjectManagementSystem1.Model.Dto.CascadedFilterDto;

namespace ProjectManagementSystem1.Services.CascadedFilterService
{
    public interface ICascadedFilterService
    {
        Task<List<FilterOptionDto>> GetDepartmentsAsync();
        Task<List<FilterOptionDto>> GetProjectsByDepartmentAsync(string department);
        Task<List<FilterOptionDto>> GetMilestonesByProjectAsync(int projectId);
        Task<List<FilterOptionDto>> GetTasksByProjectAsync(int projectId);
        Task<List<FilterOptionDto>> GetUsersByDepartmentAsync(string department);
        Task<List<FilterOptionDto>> GetUsersByProjectAsync(int projectId);
        Task<List<FilterOptionDto>> GetIssuesByProjectAsync(int projectId);
        Task<List<FilterOptionDto>> GetIssuesByTaskAsync(int taskId);
        Task<CascadedFilterDataDto> GetCascadedFilterDataAsync(CascadedFilterRequestDto request);
    }
}
