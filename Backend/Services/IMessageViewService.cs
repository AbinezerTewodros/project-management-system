using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
public interface IMessageViewService
{
    Task<MessageViewDto> RecordViewAsync(MessageViewDto dto);
    Task<IEnumerable<MessageViewDto>> GetViewsByMessageIdAsync(long messageId);
    Task<bool> SoftDeleteViewAsync(long viewId);
}
}
