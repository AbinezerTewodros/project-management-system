using ProjectManagementSystem1.Model.Dto.Erp;

namespace ProjectManagementSystem1.Services.ErpUserService
{
    public interface IErpUserService
    {
        Task<ErpUserDto> SyncSingleUserAsync(string employeeId);
        Task<List<ErpUserDto>> SyncMultipleUsersAsync(List<string> employeeIds);
        Task<List<ErpUserDto>> SyncAllUsersAsync();
    }


}