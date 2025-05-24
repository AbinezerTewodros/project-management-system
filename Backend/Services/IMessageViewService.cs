namespace ProjectManagementSystem1.Services
{
public interface IMessageViewService
{
    Task<MessageViewDto> RecordViewAsync(MessageViewDto dto);
    Task<IEnumerable<MessageViewDto>> GetViewsByMessageIdAsync(long messageId);
    Task<bool> SoftDeleteViewAsync(long viewId);
}
}
