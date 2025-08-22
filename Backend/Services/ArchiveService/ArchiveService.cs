using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ArchiveDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Services.ArchiveService
{
    public class ArchiveService : IArchiveService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public ArchiveService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ArchiveDto> ArchiveEntityAsync(CreateArchiveDto dto, string userId)
        {
            var now = DateTime.UtcNow;

            // Check if already archived by this user
            var exists = await _context.Archives
                .AnyAsync(a => a.EntityId == dto.EntityId && a.EntityType == dto.EntityType && a.ArchivedBy == userId);
            if (exists)
                throw new InvalidOperationException("You already archived this item.");

            // Update related table
            switch (dto.EntityType)
            {
                case EntityType.Project:
                    var project = await _context.Projects.FindAsync(int.Parse(dto.EntityId));
                    if (project == null) throw new ArgumentException("Project not found.");
                    project.IsArchived = true;
                    break;

                case EntityType.User:
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.EntityId);
                    if (user == null) throw new ArgumentException("User not found.");
                    user.IsArchived = true;
                    break;

                case EntityType.Message:
                    var message = await _context.Messages.FindAsync(int.Parse(dto.EntityId));
                    if (message == null) throw new ArgumentException("Message not found.");
                    message.IsArchived = true;
                    break;
            }

            var archive = new Archive
            {
                EntityId = dto.EntityId,
                EntityType = dto.EntityType,
                ArchivedBy = userId,
                ArchivedDate = now,
                Version = BitConverter.GetBytes(now.Ticks)
            };

            _context.Archives.Add(archive);
            await _context.SaveChangesAsync();

            return _mapper.Map<ArchiveDto>(archive);
        }

        public async Task<bool> UnarchiveEntityAsync(string entityId, EntityType entityType, string userId)
        {
            var archive = await _context.Archives
                .FirstOrDefaultAsync(a => a.EntityId == entityId && a.EntityType == entityType && a.ArchivedBy == userId);
            if (archive == null)
                throw new ArgumentException("Archive record not found for this user.");

            // Update related table
            switch (entityType)
            {
                case EntityType.Project:
                    var project = await _context.Projects.FindAsync(int.Parse(entityId));
                    if (project != null) project.IsArchived = false;
                    break;

                case EntityType.User:
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == entityId);
                    if (user != null) user.IsArchived = false;
                    break;

                case EntityType.Message:
                    var message = await _context.Messages.FindAsync(int.Parse(entityId));
                    if (message != null) message.IsArchived = false;
                    break;
            }

            _context.Archives.Remove(archive);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ArchiveDto>> GetMyArchivesAsync(string userId)
        {
            var archives = await _context.Archives
                .Where(a => a.ArchivedBy == userId)
                .OrderByDescending(a => a.ArchivedDate)
                .ToListAsync();

            return _mapper.Map<List<ArchiveDto>>(archives);
        }
    }
}
