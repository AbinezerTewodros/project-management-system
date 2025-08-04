using ProjectManagementSystem1.Model.Dto.AddSkill;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.AddSkillService
{
    public interface ISkillService
    {
        Task<IEnumerable<SkillDto>> SearchSkillsAsync(string query, int limit = 10);
        Task AddSkillToUserAsync(string userId, int skillId, ProficiencyLevel? proficiency = null);
        Task RemoveSkillFromUserAsync(string userId, int skillId);
        Task<IEnumerable<UserSkillDto>> GetUserSkillsAsync(int id);
        Task<SkillDto> CreateSkillAsync(SkillCreateDto dto);
        Task ApproveSkillAsync(int skillId);
        Task<IEnumerable<SkillDto>> GetPendingSkillsAsync();
        Task<int> GetPendingSkillsCountAsync();
        Task EndorseSkillAsync(string userId, int skillId);
        Task<List<AddSkill>> LoadSkillsFromEscoApi(string query = "", int limit = 100);

    }
}
