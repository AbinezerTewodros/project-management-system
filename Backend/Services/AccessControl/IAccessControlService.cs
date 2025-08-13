using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.AccessControl
{
    public interface IAccessControlService
    {
        bool CanAssignRole(IEnumerable<string> currentUserRoles, string targetRole);
        Task<IReadOnlySet<string>> GetSubordinateUserIdsAsync(string supervisorUserId);

        Task<IQueryable<Project>> FilterProjectsForUserAsync(IQueryable<Project> query, ApplicationUser user, IEnumerable<string> roles);
        Task<IQueryable<ApplicationUser>> FilterUsersForUserAsync(IQueryable<ApplicationUser> query, ApplicationUser user, IEnumerable<string> roles);

        Task<IReadOnlySet<string>> GetAllowedUserIdsAsync(ApplicationUser user, IEnumerable<string> roles);
        Task<IQueryable<ProjectTask>> FilterProjectTasksForUserAsync(IQueryable<ProjectTask> query, ApplicationUser user, IEnumerable<string> roles);
        Task<IQueryable<TodoItem>> FilterTodoItemsForUserAsync(IQueryable<TodoItem> query, ApplicationUser user, IEnumerable<string> roles);
        Task<IQueryable<Issue>> FilterIssuesForUserAsync(IQueryable<Issue> query, ApplicationUser user, IEnumerable<string> roles);
    }
} 