namespace ProjectManagementSystem1.Services
{
public interface IDepartmentalMessageService
{
    Task<DepartmentalMessageDto> GetByIdAsync(long id);
    Task<IEnumerable<DepartmentalMessageDto>> GetByDepartmentAsync(int deptId);
    Task<DepartmentalMessageDto> CreateAsync(DepartmentalMessageDto dto);
    Task<bool> UpdateAsync(long id, string newContent);
    Task<bool> SoftDeleteAsync(long id);
}
}
