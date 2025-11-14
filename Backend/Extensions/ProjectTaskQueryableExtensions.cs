using ProjectManagementSystem1.Model.Entities;

public static class ProjectTaskQueryableExtensions
{
    public static IQueryable<ProjectTask> ApplyFilter(this IQueryable<ProjectTask> query, ProjectTaskFilterDto filter)
    {
        if (filter.ProjectAssignmentId.HasValue)
            query = query.Where(t => t.ProjectAssignmentId == filter.ProjectAssignmentId.Value);

        if (!string.IsNullOrEmpty(filter.AssignedMemberId))
            query = query.Where(t => t.AssignedMemberId == filter.AssignedMemberId);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.Priority.HasValue)
            query = query.Where(t => t.Priority == filter.Priority.Value);

        if (filter.Depth.HasValue)
            query = query.Where(t => t.Depth == filter.Depth.Value);

        if (filter.IsLeaf.HasValue)
            query = query.Where(t => t.IsLeaf == filter.IsLeaf.Value);

        if (filter.DueDateBefore.HasValue)
            query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value <= filter.DueDateBefore.Value);

        if (filter.DueDateAfter.HasValue)
            query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value >= filter.DueDateAfter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(t => t.Title.Contains(term) || (t.Description != null && t.Description.Contains(term)));
        }

        return query;
    }
}
