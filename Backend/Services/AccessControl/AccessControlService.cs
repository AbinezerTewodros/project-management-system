using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Services.AccessControl
{
    public class AccessControlService : IAccessControlService
    {
        private readonly AppDbContext _context;

        public AccessControlService(AppDbContext context)
        {
            _context = context;
        }

        public bool CanAssignRole(IEnumerable<string> currentUserRoles, string targetRole)
        {
            if (string.IsNullOrWhiteSpace(targetRole)) return false;

            int targetRank = SystemRoles.RoleRank.TryGetValue(targetRole, out var r) ? r : 0;
            if (targetRank == 0) return false; // unknown target role

            // Admin can assign anyone
            if (currentUserRoles.Any(rn => rn == SystemRoles.Admin)) return true;

            // Highest role rank of current user
            int currentRank = currentUserRoles
                .Select(rn => SystemRoles.RoleRank.TryGetValue(rn, out var rr) ? rr : 0)
                .DefaultIfEmpty(0)
                .Max();

            // Must be strictly higher rank than target
            return currentRank > targetRank;
        }

        public async Task<IReadOnlySet<string>> GetSubordinateUserIdsAsync(string supervisorUserId)
        {
            var result = new HashSet<string>();
            if (string.IsNullOrEmpty(supervisorUserId)) return result;

            // BFS traversal of org chart
            var queue = new Queue<string>();
            queue.Enqueue(supervisorUserId);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();

                var directReports = await _context.Users
                    .Where(u => u.ReportsToUserId == current)
                    .Select(u => u.Id)
                    .ToListAsync();

                foreach (var dr in directReports)
                {
                    if (result.Add(dr))
                    {
                        queue.Enqueue(dr);
                    }
                }
            }

            // exclude the supervisor themselves
            result.Remove(supervisorUserId);
            return result;
        }

        public async Task<IReadOnlySet<string>> GetAllowedUserIdsAsync(ApplicationUser user, IEnumerable<string> roles)
        {
            var allowed = new HashSet<string> { user.Id };
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                // All users allowed
                var allUserIds = await _context.Users.Select(u => u.Id).ToListAsync();
                foreach (var id in allUserIds) allowed.Add(id);
                return allowed;
            }

            // Leadership: include subordinates
            var subordinateIds = await GetSubordinateUserIdsAsync(user.Id);
            foreach (var id in subordinateIds) allowed.Add(id);
            return allowed;
        }

        private async Task<IReadOnlySet<string>> GetAllowedDepartmentsAsync(ApplicationUser user, IEnumerable<string> roles)
        {
            var allowedUserIds = await GetAllowedUserIdsAsync(user, roles);
            var depts = await _context.Users
                .Where(u => allowedUserIds.Contains(u.Id) && u.Department != null)
                .Select(u => u.Department)
                .Distinct()
                .ToListAsync();
            var set = new HashSet<string>(depts);
            if (!string.IsNullOrEmpty(user.Department)) set.Add(user.Department);
            return set;
        }

        public async Task<IQueryable<Project>> FilterProjectsForUserAsync(IQueryable<Project> query, ApplicationUser user, IEnumerable<string> roles)
        {
            // Admin and President have full visibility
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                return query;
            }

            // Members: only projects where they are assigned
            if (roles.Any() && roles.All(r => r == SystemRoles.Member))
            {
                return query.Where(p => p.ProjectAssignments.Any(a => a.MemberId == user.Id));
            }

            // Leadership: VP, Director, Manager, Supervisor
            var allowedUserIds = await GetAllowedUserIdsAsync(user, roles);
            var allowedDepts = await GetAllowedDepartmentsAsync(user, roles);
            return query.Where(p => allowedDepts.Contains(p.Department)
                                  || p.ProjectAssignments.Any(a => allowedUserIds.Contains(a.MemberId)));
        }

        public async Task<IQueryable<ApplicationUser>> FilterUsersForUserAsync(IQueryable<ApplicationUser> query, ApplicationUser user, IEnumerable<string> roles)
        {
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                return query;
            }

            if (roles.Any() && roles.All(r => r == SystemRoles.Member))
            {
                return query.Where(u => u.Id == user.Id);
            }

            var subordinateIds = await GetSubordinateUserIdsAsync(user.Id);
            if (subordinateIds.Count == 0)
            {
                return query.Where(u => u.Id == user.Id);
            }

            return query.Where(u => subordinateIds.Contains(u.Id) || u.Id == user.Id);
        }

        public async Task<IQueryable<ProjectTask>> FilterProjectTasksForUserAsync(IQueryable<ProjectTask> query, ApplicationUser user, IEnumerable<string> roles)
        {
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                return query;
            }

            var allowedUserIds = await GetAllowedUserIdsAsync(user, roles);
            var allowedDepts = await GetAllowedDepartmentsAsync(user, roles);
            return query.Where(t => allowedUserIds.Contains(t.AssignedMemberId)
                                 || _context.ProjectAssignments.Any(pa => pa.Id == t.ProjectAssignmentId && (allowedUserIds.Contains(pa.MemberId)
                                                                                                             || (pa.Member != null && allowedDepts.Contains(pa.Member.Department))
                                                                                                             || (pa.Project != null && allowedDepts.Contains(pa.Project.Department)))));
        }

        public async Task<IQueryable<TodoItem>> FilterTodoItemsForUserAsync(IQueryable<TodoItem> query, ApplicationUser user, IEnumerable<string> roles)
        {
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                return query;
            }
            var allowedUserIds = await GetAllowedUserIdsAsync(user, roles);
            var allowedDepts = await GetAllowedDepartmentsAsync(user, roles);
            return query.Where(ti => allowedUserIds.Contains(ti.AssigneeId)
                                  || _context.ProjectTasks.Any(pt => pt.Id == ti.ProjectTaskId && _context.ProjectAssignments.Any(pa => pa.Id == pt.ProjectAssignmentId && (allowedUserIds.Contains(pa.MemberId)
                                                                                                                                                                              || (pa.Member != null && allowedDepts.Contains(pa.Member.Department))
                                                                                                                                                                              || (pa.Project != null && allowedDepts.Contains(pa.Project.Department))))));
        }

        public async Task<IQueryable<Issue>> FilterIssuesForUserAsync(IQueryable<Issue> query, ApplicationUser user, IEnumerable<string> roles)
        {
            if (roles.Contains(SystemRoles.Admin) || roles.Contains(SystemRoles.President))
            {
                return query;
            }
            var allowedUserIds = await GetAllowedUserIdsAsync(user, roles);
            var allowedDepts = await GetAllowedDepartmentsAsync(user, roles);
            return query.Where(i => (i.AssigneeId != null && allowedUserIds.Contains(i.AssigneeId))
                                 || (i.ReporterId != null && allowedUserIds.Contains(i.ReporterId))
                                 || (i.ProjectId != null && _context.Projects.Any(p => p.Id == i.ProjectId && allowedDepts.Contains(p.Department)))
                                 || (i.ProjectTaskId != null && _context.ProjectTasks.Any(pt => pt.Id == i.ProjectTaskId && _context.ProjectAssignments.Any(pa => pa.Id == pt.ProjectAssignmentId && (allowedUserIds.Contains(pa.MemberId)
                                                                                                                                                                                                                       || (pa.Member != null && allowedDepts.Contains(pa.Member.Department))
                                                                                                                                                                                                                       || (pa.Project != null && allowedDepts.Contains(pa.Project.Department)))))));
        }
    }
}