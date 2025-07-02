using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public class ProjectChatGroupService : IProjectChatGroupService
    {
        private readonly AppDbContext _context;

        public ProjectChatGroupService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> CreateGroupAsync(CreateChatGroupDto dto, string currentUserId)
        {
            // Confirm project exists
            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null) throw new ArgumentException("Project not found");

            // Create group
            var group = new ProjectChatGroup
            {
                ProjectId = dto.ProjectId,
                GroupName = dto.GroupName,
                CreatedByUserId = currentUserId,
                CreatedDate = DateTime.UtcNow
            };

            _context.ProjectChatGroups.Add(group);
            await _context.SaveChangesAsync();

            // Resolve users by EmployeeId
            var users = await _context.Users
                .Where(u => dto.MemberEmployeeIds.Contains(u.EmployeeId))
                .ToListAsync();

            var members = users.Select(u => new ProjectChatGroupMember
            {
                ChatGroupId = group.Id,
                UserId = u.Id
            });

            _context.ProjectChatGroupMembers.AddRange(members);
            await _context.SaveChangesAsync();

            return group.Id;
        }

        public async Task<List<ProjectChatGroupDto>> GetGroupsByProjectIdAsync(int projectId)
        {
            return await _context.ProjectChatGroups
                .Where(g => g.ProjectId == projectId)
                .Select(g => new ProjectChatGroupDto
                {
                    GroupId = g.Id,
                    GroupName = g.GroupName,
                    CreatedDate = g.CreatedDate,
                    MemberCount = g.Members.Count
                }).ToListAsync();
        }

        public async Task<List<MessageDto>> GetMessagesByGroupIdAsync(int groupId)
        {
            return await _context.Messages
                .Where(m => m.ChatGroupId == groupId)
                .OrderBy(m => m.TimeSent)
                .Select(m => new MessageDto
                {
                    Content = m.Content,
                    SenderId = m.SenderId,
                    TimeSent = m.TimeSent
                }).ToListAsync();
        }
    }

}
