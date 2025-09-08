
using ProjectManagementSystem1.Model.Dto.ADDto;

namespace ProjectManagementSystem1.Services.ADService
{
    public interface IADAuthService
    {
        bool Authenticate(string username, string password);
        EmployeeADDto GetEmployee(string empId);
        Task<List<EmployeeADDto>> GetUsersByOrganizationalUnitsAsync(List<string> organizationalUnits);
    }
}
