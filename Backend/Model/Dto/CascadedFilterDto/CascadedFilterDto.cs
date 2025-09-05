namespace ProjectManagementSystem1.Model.Dto.CascadedFilterDto
{
    public class FilterOptionDto
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDisabled { get; set; } = false;
        public Dictionary<string, object>? Metadata { get; set; }
    }

    public class CascadedFilterRequestDto
    {
        public string? Department { get; set; }
        public int? ProjectId { get; set; }
        public int? MilestoneId { get; set; }
        public int? TaskId { get; set; }
        public string? UserId { get; set; }
        public string FilterType { get; set; } = string.Empty; // "departments", "projects", "milestones", "tasks", "users", "issues"
    }

    public class CascadedFilterDataDto
    {
        public List<FilterOptionDto> Departments { get; set; } = new();
        public List<FilterOptionDto> Projects { get; set; } = new();
        public List<FilterOptionDto> Milestones { get; set; } = new();
        public List<FilterOptionDto> Tasks { get; set; } = new();
        public List<FilterOptionDto> Users { get; set; } = new();
        public List<FilterOptionDto> Issues { get; set; } = new();
        public List<FilterOptionDto> Priorities { get; set; } = new();
        public List<FilterOptionDto> Statuses { get; set; } = new();
        public List<FilterOptionDto> IssueTypes { get; set; } = new();
        public List<FilterOptionDto> Roles { get; set; } = new();
    }

    public class ProjectFilterCascadeDto
    {
        public string? Department { get; set; }
        public int? ProjectId { get; set; }
        public string? Priority { get; set; }
        public string? Status { get; set; }
    }

    public class TaskFilterCascadeDto
    {
        public string? Department { get; set; }
        public int? ProjectId { get; set; }
        public int? MilestoneId { get; set; }
        public string? AssignedUserId { get; set; }
        public string? Priority { get; set; }
        public string? Status { get; set; }
    }

    public class IssueFilterCascadeDto
    {
        public string? Department { get; set; }
        public int? ProjectId { get; set; }
        public int? TaskId { get; set; }
        public string? AssignedUserId { get; set; }
        public string? Priority { get; set; }
        public string? Status { get; set; }
        public string? IssueType { get; set; }
    }
}
