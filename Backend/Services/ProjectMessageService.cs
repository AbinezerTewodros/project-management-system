using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.DTOs;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public class ProjectMessageService : IProjectMessageService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public ProjectMessageService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ProjectMessageDto> GetByIdAsync(long id)
        {
            var message = await _context.ProjectMessages
                .Include(m => m.Attachment)
                .FirstOrDefaultAsync(m => m.MessageId == id);

            return message == null ? null : _mapper.Map<ProjectMessageDto>(message);
        }

        public async Task<IEnumerable<ProjectMessageDto>> GetByProjectAsync(long projectId)
        {
            var messages = await _context.ProjectMessages
                .Where(m => m.ProjectId == projectId && !m.IsDeleted)
                .OrderByDescending(m => m.TimeSent)
                .Include(m => m.Attachment)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProjectMessageDto>>(messages);
        }

        public async Task<ProjectMessageDto> CreateAsync(ProjectMessageDto dto)
        {
            var message = _mapper.Map<ProjectMessage>(dto);
            message.TimeSent = DateTime.UtcNow;

            _context.ProjectMessages.Add(message);
            await _context.SaveChangesAsync();

            return _mapper.Map<ProjectMessageDto>(message);
        }

        public async Task<bool> UpdateAsync(long id, string newContent)
        {
            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null) return false;

            message.Content = newContent;
            message.TimeEdited = DateTime.UtcNow;
            message.Version += 1;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteAsync(long id)
        {
            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null) return false;

            message.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
