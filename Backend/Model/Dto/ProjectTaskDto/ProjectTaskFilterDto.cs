using ProjectManagementSystem1.Model.Entities;

public class ProjectTaskFilterDto
{
    public int? ProjectAssignmentId { get; set; }  // Filter by project assignment
    public string? AssignedMemberId { get; set; }  // Filter by assignee
    public string? Description { get; set; }
    public ProjectManagementSystem1.Model.Entities.TaskStatus? Status { get; set; }        // Filter by status
    public TaskPriority? Priority { get; set; }    // Filter by priority
    public int? Depth { get; set; }                 // Filter by depth in hierarchy
    public bool? IsLeaf { get; set; }               // Filter leaf tasks or not
    public DateTime? DueDateBefore { get; set; }
    public DateTime? DueDateAfter { get; set; }
    public string? SearchTerm { get; set; }         // Search in title/description

    // Pagination info
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
