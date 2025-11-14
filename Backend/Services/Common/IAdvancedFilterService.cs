using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.Issue;
using ProjectManagementSystem1.Model.Dto.ProjectDto;

namespace ProjectManagementSystem1.Services.Common
{
    public interface IAdvancedFilterService
    {
        // Generic filtering
        Task<FilterResultDto<T>> ApplyAdvancedFilterAsync<T>(
            IQueryable<T> query,
            AdvancedFilterDto filterDto) where T : class;

        // Project filtering
        Task<FilterResultDto<ProjectDto>> FilterProjectsAsync(ProjectFilterDto filterDto);
        Task<List<FilterOptionDto>> GetProjectFilterOptionsAsync();
        Task<Dictionary<string, object>> GetProjectFilterValuesAsync();

        // Task filtering
        Task<FilterResultDto<ProjectTaskReadDto>> FilterTasksAsync(TaskFilterDto filterDto);
        Task<List<FilterOptionDto>> GetTaskFilterOptionsAsync();
        Task<Dictionary<string, object>> GetTaskFilterValuesAsync();

        // Assignment filtering
        Task<FilterResultDto<EnhancedAssignmentDto>> FilterAssignmentsAsync(AssignmentFilterDto filterDto);
        Task<List<FilterOptionDto>> GetAssignmentFilterOptionsAsync();
        Task<Dictionary<string, object>> GetAssignmentFilterValuesAsync();

        // Issue filtering
        Task<FilterResultDto<IssueDto>> FilterIssuesAsync(IssueFilterDto filterDto);
        Task<List<FilterOptionDto>> GetIssueFilterOptionsAsync();
        Task<Dictionary<string, object>> GetIssueFilterValuesAsync();

        // Cascaded filtering
        Task<FilterResultDto<T>> ApplyCascadedFilterAsync<T>(
            IQueryable<T> query,
            CascadedFilterDto cascadedFilter) where T : class;

        // Search functionality
        Task<FilterResultDto<T>> SearchAsync<T>(
            IQueryable<T> query,
            string searchTerm,
            string? searchFields = null) where T : class;

        // Filter building
        IQueryable<T> BuildFilterQuery<T>(
            IQueryable<T> query,
            AdvancedFilterDto filterDto) where T : class;

        // Filter validation
        bool ValidateFilter(AdvancedFilterDto filterDto);
        List<string> GetValidationErrors(AdvancedFilterDto filterDto);
    }
}
