using ProjectManagementSystem1.Model.Dto.Message;

namespace ProjectManagementSystem1.Services
{
    public interface IProjectChatGroupService
    {
        Task<int> CreateGroupAsync(CreateChatGroupDto dto, string currentUserId);
        Task<List<ProjectChatGroupDto>> GetGroupsByProjectIdAsync(int projectId);
        Task<List<MessageDto>> GetMessagesByGroupIdAsync(int groupId);
    }

}
