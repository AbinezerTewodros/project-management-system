namespace ProjectManagementSystem1.Services
{
public interface IProjectMessageService
{
    Task<ProjectMessageDto> GetByIdAsync(long id);
    Task<IEnumerable<ProjectMessageDto>> GetByProjectAsync(long projectId);
    Task<ProjectMessageDto> CreateAsync(ProjectMessageDto dto);
    Task<bool> UpdateAsync(long id, string newContent);
    Task<bool> SoftDeleteAsync(long id);
}
}
