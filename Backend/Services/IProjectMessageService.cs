using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
public interface IProjectMessageService
{
    Task<ProjectMessageDto> GetByIdAsync(long id);
    Task<IEnumerable<ProjectMessageDto>> GetByProjectAsync(long projectId);
    Task<ProjectMessageDto> CreateAsync(ProjectMessageDto dto);
    Task<bool> UpdateAsync(long id, string newContent);
    Task<bool> SoftDeleteAsync(long id);
}
}
