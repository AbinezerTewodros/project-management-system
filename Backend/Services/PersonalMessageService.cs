using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace ProjectManagementSystem1.Services
{
    public class PersonalMessageService : IPersonalMessageService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PersonalMessageService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PersonalMessageDto> GetByIdAsync(long id)
        {
            var msg = await _context.PersonalMessages
                .Include(m => m.Attachment)
                .FirstOrDefaultAsync(m => m.MessageId == id);

            return msg == null ? null : _mapper.Map<PersonalMessageDto>(msg);
        }

        public async Task<IEnumerable<PersonalMessageDto>> GetByUsersAsync(long senderId, long receiverId)
        {
            var msgs = await _context.PersonalMessages
                .Where(m =>
                    ((m.SenderId == senderId && m.ReceiverId == receiverId) ||
                     (m.SenderId == receiverId && m.ReceiverId == senderId))
                    && !m.IsDeleted)
                .OrderByDescending(m => m.TimeSent)
                .Include(m => m.Attachment)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PersonalMessageDto>>(msgs);
        }

        public async Task<PersonalMessageDto> CreateAsync(PersonalMessageDto dto)
        {
            var entity = _mapper.Map<PersonalMessage>(dto);
            entity.TimeSent = DateTime.UtcNow;
            _context.PersonalMessages.Add(entity);
            await _context.SaveChangesAsync();
            return _mapper.Map<PersonalMessageDto>(entity);
        }

        public async Task<bool> UpdateAsync(long id, string newContent)
        {
            var msg = await _context.PersonalMessages.FindAsync(id);
            if (msg == null) return false;
            msg.Content = newContent;
            msg.TimeEdited = DateTime.UtcNow;
            msg.Version += 1;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteAsync(long id)
        {
            var msg = await _context.PersonalMessages.FindAsync(id);
            if (msg == null) return false;
            msg.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
