using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public class MessageViewService : IMessageViewService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MessageViewService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MessageViewDto> RecordViewAsync(MessageViewDto dto)
        {
            var entity = _mapper.Map<MessageView>(dto);
            entity.SeenTimestamp = DateTime.UtcNow;
            _context.MessageViews.Add(entity);
            await _context.SaveChangesAsync();
            return _mapper.Map<MessageViewDto>(entity);
        }

        public async Task<IEnumerable<MessageViewDto>> GetViewsByMessageIdAsync(long messageId)
        {
            var views = await _context.MessageViews
                .Where(v => v.MessageId == messageId && !v.IsDeleted)
                .OrderBy(v => v.SeenTimestamp)
                .ToListAsync();

            return _mapper.Map<IEnumerable<MessageViewDto>>(views);
        }

        public async Task<bool> SoftDeleteViewAsync(long viewId)
        {
            var view = await _context.MessageViews.FindAsync(viewId);
            if (view == null) return false;
            view.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
