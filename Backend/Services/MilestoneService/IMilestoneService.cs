using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public interface IMilestoneService
    {
        Task<Milestone> GetMilestoneByIdAsync(int id);
        Task<IEnumerable<Milestone>> GetAllMilestoneAsync();
        Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId);
        Task<MilestoneReadDto> CreateAsync(CreateMilestoneDto dto);
        Task<MilestoneReadDto> UpdateMilestoneAsync(int id, UpdateMilestoneDto dto);
        Task<bool> DeleteMilestoneAsync(int id);
    }
}
