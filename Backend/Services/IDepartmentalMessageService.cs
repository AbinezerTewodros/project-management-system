using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
public interface IDepartmentalMessageService
{
    Task<DepartmentalMessageDto> GetByIdAsync(long id);
    Task<IEnumerable<DepartmentalMessageDto>> GetByDepartmentAsync(int deptId);
    Task<DepartmentalMessageDto> CreateAsync(DepartmentalMessageDto dto);
    Task<bool> UpdateAsync(long id, string newContent);
    Task<bool> SoftDeleteAsync(long id);
}
}
