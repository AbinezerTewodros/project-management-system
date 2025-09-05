using ProjectManagementSystem1.Model.Dto.EmployeeAvailabilityDto;

namespace ProjectManagementSystem1.Services.EmployeeAvailabilityService
{
    public interface IEmployeeAvailabilityService
    {
        Task<EmployeeAvailabilityDto> GetEmployeeAvailabilityAsync(string employeeId);
        Task<List<EmployeeWorkloadDto>> GetTeamWorkloadAsync(string managerId);
        Task<bool> ReassignProjectAsync(int projectId, string fromEmployeeId, string toEmployeeId, string managerId);
        Task<List<EmployeeCapacityDto>> GetAvailableEmployeesForAssignmentAsync(string department, DateTime requiredBy);
        Task<WorkloadSummaryDto> GetEmployeeWorkloadSummaryAsync(string employeeId);
    }
}
