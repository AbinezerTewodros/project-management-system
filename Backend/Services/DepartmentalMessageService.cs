using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagemetSystem1.Services
{
public class DepartmentalMessageService : IDepartmentalMessageService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public DepartmentalMessageService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<DepartmentalMessageDto> GetByIdAsync(long id)
    {
        var msg = await _context.DepartmentalMessages
            .Include(m => m.Attachment)
            .FirstOrDefaultAsync(m => m.MessageId == id);
        return msg == null ? null : _mapper.Map<DepartmentalMessageDto>(msg);
    }

    public async Task<IEnumerable<DepartmentalMessageDto>> GetByDepartmentAsync(int deptId)
    {
        var msgs = await _context.DepartmentalMessages
            .Where(m => m.ReceiverDepartmentId == deptId && !m.IsDeleted)
            .OrderByDescending(m => m.TimeSent)
            .Include(m => m.Attachment)
            .ToListAsync();

        return _mapper.Map<IEnumerable<DepartmentalMessageDto>>(msgs);
    }

    public async Task<DepartmentalMessageDto> CreateAsync(DepartmentalMessageDto dto)
    {
        var entity = _mapper.Map<DepartmentalMessage>(dto);
        entity.TimeSent = DateTime.UtcNow;
        _context.DepartmentalMessages.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<DepartmentalMessageDto>(entity);
    }

    public async Task<bool> UpdateAsync(long id, string newContent)
    {
        var msg = await _context.DepartmentalMessages.FindAsync(id);
        if (msg == null) return false;
        msg.Content = newContent;
        msg.TimeEdited = DateTime.UtcNow;
        msg.Version += 1;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(long id)
    {
        var msg = await _context.DepartmentalMessages.FindAsync(id);
        if (msg == null) return false;
        msg.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
}
