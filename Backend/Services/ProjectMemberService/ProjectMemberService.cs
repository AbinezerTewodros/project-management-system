using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ResourceAcessService
{
    public class ProjectMemberService : IProjectMemberService
    {
        private readonly AppDbContext _context;

        public ProjectMemberService(AppDbContext context)
        {
            _context = context;
        }

        //public async Task<bool> IsMemberAsync(string entityType, string entityId, string userId)
        //{
        //    return entityType switch
        //    {
        //        "Project" => await _context.ProjectAssignments
        //            .AnyAsync(a => a.ProjectId.ToString() == entityId && a.MemberId == userId),

        //        "ProjectTask" => await _context.ProjectTasks
        //            .AnyAsync(a => a.Id.ToString() == entityId && a.AssignedMemberId == userId),

        //        "Milestone" => await _context.Milestones
        //            .AnyAsync(a => a.MilestoneId.ToString() == entityId && a.AssignedMemberId == userId),

        //        "TodoItem" => await _context.TodoItems
        //            .AnyAsync(a => a.Id.ToString() == entityId && a.AssigneeId == userId),

        //        _ => await _context.ProjectAssignments
        //            .AnyAsync(a => a.ProjectId.ToString() == entityId && a.MemberId == userId)
        //    };
        //}

        public async Task<bool> IsMemberAsync(string entityType, string entityId, string userId)
        {
            // Check all possible assignment types
            return await _context.ProjectAssignments.AnyAsync(pa =>
                    pa.ProjectId.ToString() == entityId && pa.MemberId == userId)
                || await _context.ProjectTasks.AnyAsync(pt =>
                    pt.Id.ToString() == entityId && pt.AssignedMemberId == userId)
                || await _context.Milestones.AnyAsync(m =>
                    m.MilestoneId.ToString() == entityId && m.AssignedMemberId == userId)
                || await _context.TodoItems.AnyAsync(t =>
                    t.Id.ToString() == entityId && t.AssigneeId == userId);
        }

    }

}
