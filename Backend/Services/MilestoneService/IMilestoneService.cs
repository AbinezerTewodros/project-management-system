using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public interface IMilestoneService
    {
        Task<MilestoneReadDto> GetMilestoneByIdAsync(int id);
        Task<IEnumerable<MilestoneReadDto>> GetAllMilestoneAsync();
        Task<IEnumerable<MilestoneReadDto>> GetMilestonesByProjectIdAsync(int projectId);
        Task<MilestoneReadDto> CreateAsync(CreateMilestoneDto dto);
        Task<MilestoneReadDto> UpdateMilestoneAsync(int id, UpdateMilestoneDto dto);
        Task<bool> DeleteMilestoneAsync(int id);
        Task<double> CalculateMilestoneProgress(int milestoneId);
        Task UpdateMilestoneProgress(int milestoneId);
    }
}
