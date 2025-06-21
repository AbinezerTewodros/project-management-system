namespace ProjectManagementSystem1.Services
{
    public interface ISkillService
    {
        Task<List<SkillSuggestionDto>> SuggestSkillsAsync(string query);    // live filter
        Task<Skill> AddSkillAsync(string name);              // add new skill (pending approval)
        Task<List<Skill>> GetAllPendingSkillsAsync();        // admin view
        Task ApproveSkillAsync(int skillId);                 // admin approve
        Task RejectSkillAsync(int skillId);                  // admin reject
    }

    public interface IUserSkillService
    {
        Task AddSkillToUserAsync(string userId, int skillId);     // link approved skill
        Task<List<Skill>> GetUserSkillsAsync(string userId);      // fetch user's skills
        Task RemoveSkillFromUserAsync(string userId, int skillId); // remove skill
    }
}