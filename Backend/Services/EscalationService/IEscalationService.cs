using ProjectManagementSystem1.Model.Dto.EscalationDto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.EscalationService
{
    public interface IEscalationService
    {
        Task<EscalationDto> SendEscalationAsync(SendEscalationDto dto, string senderId);
        Task<EscalationReplyDto> ReplyToEscalationAsync(EscalationReplyDto dto);
        Task<List<EscalationReplyDto>> GetEscalationRepliesAsync(int escalationId);
        Task<List<EscalationReplyDto>> GetMyRepliesAsync(string userId);
        Task<List<EscalationDto>> GetEscalationsAsync(string senderId);
        Task<List<EscalationDto>> GetMyEscalationsAsync(string receiverId);
        Task<bool> EditEscalationAsync(EditEscalationDto dto, string senderId);
        Task<int> GetUnreadEscalationCountAsync(string userId);
        Task<bool> MarkEscalationAsReadAsync(int escalationId, string userId);
        // method for background service
        Task EscalateToManagerAsync(int escalationId);
        Task<bool> ResolveEscalationAsync(int escalationId, string userId);
        Task<bool> CloseEscalationAsync(int escalationId, string userId);
        Task<List<EscalationDto>> GetResolvedEscalationsAsync(string userId);
        Task<List<EscalationDto>> GetClosedEscalationsAsync(string userId);
        Task<List<EscalationDto>> GetMyResolvedEscalationsAsync(string userId);
        Task<List<EscalationDto>> GetMyClosedEscalationsAsync(string userId);
    }
}