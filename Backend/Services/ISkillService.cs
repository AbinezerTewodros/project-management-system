//using ProjectManagementSystem1.Data;
//using ProjectManagementSystem1.Model.Dto;
//using ProjectManagementSystem1.Model.Entities;
//using ProjectManagementSystem1.Services;

//namespace ProjectManagementSystem1.Services
//{
//    public interface ISkillService
//    {
//        Task<List<SkillSuggestionDto>> SuggestSkillsAsync(string query);    // live filter
//        Task<Skill> AddSkillAsync(string name);              // add new skill (pending approval)
//        Task<List<Skill>> GetAllPendingSkillsAsync();        // admin view
//        Task ApproveSkillAsync(int skillId);                 // admin approve
//        Task RejectSkillAsync(int skillId);                  // admin reject
//    }
//}