using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.MessageService
{
    public class MessageService : IMessageService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MessageService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MessageDto> SendMessageAsync(CreateMessageDto dto, string senderUserId)
        {
            var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderUserId);
            if (sender == null)
                throw new Exception("Sender not found.");


            if (dto.MessageType < 1 || dto.MessageType > 3)
                throw new ArgumentException("MessageType must be 1 (Project), 2 (Department), or 3 (Personal).");

            if (dto.MessageType == 1 && dto.ProjectId == null)
                throw new ArgumentException("ProjectId is required for project messages.");
            if (dto.MessageType == 3 && string.IsNullOrWhiteSpace(dto.ReceiverId))
                throw new ArgumentException("ReceiverId is required for personal messages.");
            if (dto.MessageType == 2)
            {
                dto.ProjectId = null;
                dto.ReceiverId = null;
            }

            var message = new Message
            {
                Content = dto.Content,
                SenderId = sender.Id,
                ReceiverId = dto.ReceiverId,
                ProjectId = dto.ProjectId,
                MessageType = dto.MessageType,
                AttachmentId = dto.AttachmentId,
                TimeSent = DateTime.UtcNow,
                IsDeleted = false,
                IsRead = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // ✅ Handle group read tracking for Project/Department messages
            if (dto.MessageType == 1 || dto.MessageType == 2)
            {
                var recipients = dto.MessageType == 1
                    ? await _context.ProjectAssignments
                        .Where(pa => pa.ProjectId == dto.ProjectId && pa.MemberId != sender.Id)
                        .Select(pa => pa.MemberId)
                        .ToListAsync()
                    : await _context.Users
                        .Where(u => u.Department == sender.Department && u.Id != sender.Id)
                        .Select(u => u.Id)
                        .ToListAsync();

                var readStatuses = recipients.Select(uid => new MessageReadStatus
                {
                    MessageId = message.MessageId,
                    UserId = uid,
                    IsRead = false
                });

                _context.MessageReadStatuses.AddRange(readStatuses);
                await _context.SaveChangesAsync();
            }

            message = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .FirstOrDefaultAsync(m => m.MessageId == message.MessageId);

            return _mapper.Map<MessageDto>(message);
        }


        public async Task<List<MessageDto>> GetProjectMessagesAsync(int projectId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m => m.ProjectId == projectId && m.MessageType == 1 && !m.IsDeleted)
                .OrderBy(m => m.TimeSent)
                .ToListAsync();

            return _mapper.Map<List<MessageDto>>(messages);
        }

        public async Task<List<MessageDto>> GetDepartmentMessagesAsync(string department)
        {
            var senderIds = await _context.Users
                .Where(u => u.Department == department)
                .Select(u => u.Id)
                .ToListAsync();

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m => m.MessageType == 2 && senderIds.Contains(m.SenderId) && !m.IsDeleted)
                .OrderBy(m => m.TimeSent)
                .ToListAsync();

            return _mapper.Map<List<MessageDto>>(messages);
        }

        public async Task<List<MessageDto>> GetPersonalMessagesAsync(string userId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m =>
                    m.MessageType == 3 &&
                    !m.IsDeleted &&
                    (m.SenderId == userId || m.ReceiverId == userId))
                .OrderBy(m => m.TimeSent)
                .ToListAsync();

            return _mapper.Map<List<MessageDto>>(messages);
        }



        public async Task<List<MessageDto>> GetProjectMessagesForUserAsync(string userId)
        {

            var projectIds = await _context.ProjectAssignments
                .Where(pa => pa.MemberId == userId)
                .Select(pa => pa.ProjectId)
                .ToListAsync();


            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m =>
                    m.MessageType == 1 &&
                    m.ProjectId.HasValue &&
                    projectIds.Contains(m.ProjectId.Value) &&
                    !m.IsDeleted)
                .OrderBy(m => m.TimeSent)
                .ToListAsync();

            return _mapper.Map<List<MessageDto>>(messages);
        }

        public async Task<bool> EditMessageAsync(EditMessageDto dto, string senderId)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.MessageId == dto.MessageId);
            if (message == null) throw new ArgumentException("Message not found.");
            if (message.SenderId != senderId) throw new UnauthorizedAccessException("You can only edit your own messages.");
            if (message.IsDeleted) throw new InvalidOperationException("Cannot edit a deleted message.");

            message.Content = dto.NewContent;
            message.TimeEdited = DateTime.UtcNow;
            message.Version = BitConverter.GetBytes(DateTime.UtcNow.Ticks);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteMessageAsync(int messageId, string senderId)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.MessageId == messageId);
            if (message == null) throw new ArgumentException("Message not found.");
            if (message.SenderId != senderId) throw new UnauthorizedAccessException("You can only delete your own messages.");
            if (message.IsDeleted) return true;

            message.IsDeleted = true;
            message.TimeEdited = DateTime.UtcNow;
            message.Version = BitConverter.GetBytes(DateTime.UtcNow.Ticks);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadMessageCountAsync(string userId)
        {
            // Count unread personal messages
            var personalUnread = await _context.Messages
                .Where(m => m.MessageType == 3 && m.ReceiverId == userId && !m.IsRead && !m.IsDeleted)
                .CountAsync();

            // Count unread group messages
            var groupUnread = await _context.MessageReadStatuses
                .Where(mrs => mrs.UserId == userId && !mrs.IsRead)
                .CountAsync();

            return personalUnread + groupUnread;
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.MessageId == messageId && m.ReceiverId == userId);

            if (message == null || message.IsRead) return false;

            message.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkGroupMessageAsRead(int messageId, string userId)
        {
            var status = await _context.MessageReadStatuses
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);

            if (status == null || status.IsRead) return false;

            status.IsRead = true;
            status.ReadTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
