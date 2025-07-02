using ProjectManagementSystem1.Model.Dto.Message;

namespace ProjectManagementSystem1.Services
{
    public interface IMessageService
    {
        Task<MessageDto> SendMessageAsync(CreateMessageDto dto, string senderId);
        Task<List<MessageDto>> GetProjectMessagesAsync(int projectId);
        Task<List<MessageDto>> GetDepartmentMessagesAsync(string department);
        Task<List<MessageDto>> GetPersonalMessagesAsync(string userId);
        Task<List<MessageDto>> GetProjectMessagesForUserAsync(string userId);
        Task<MessageDto> SendGroupMessageAsync(SendGroupMessageDto dto, string senderId);
        Task<List<MessageDto>> GetGroupMessagesAsync(int groupId, string requesterId);
        Task<bool> EditMessageAsync(EditMessageDto dto, string senderId);
        Task<bool> SoftDeleteMessageAsync(int messageId, string senderId);



    }

}
