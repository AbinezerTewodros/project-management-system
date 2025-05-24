using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Service
{
public interface IPersonalMessageService
{
    Task<PersonalMessageDto> GetByIdAsync(long id);
    Task<IEnumerable<PersonalMessageDto>> GetByUsersAsync(long senderId, long receiverId);
    Task<PersonalMessageDto> CreateAsync(PersonalMessageDto dto);
    Task<bool> UpdateAsync(long id, string newContent);
    Task<bool> SoftDeleteAsync(long id);
}
}
