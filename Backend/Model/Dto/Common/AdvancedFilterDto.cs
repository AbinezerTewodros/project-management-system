using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Common
{
    public class AdvancedFilterDto
    {
        // Basic pagination
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        
        // Search
        public string? SearchTerm { get; set; }
        public string? SearchFields { get; set; } // Comma-separated field names to search in
        
        // Sorting
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = false;
        
        // Date range filters
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string? DateField { get; set; } // Which date field to filter on
        
        // Status filters
        public List<string>? Statuses { get; set; }
        public List<string>? Priorities { get; set; }
        
        // User/Assignment filters
        public List<string>? AssignedUserIds { get; set; }
        public List<string>? CreatedByUserIds { get; set; }
        public List<string>? Roles { get; set; }
        
        // Project-specific filters
        public List<int>? ProjectIds { get; set; }
        public List<string>? Departments { get; set; }
        public List<string>? ProjectOwners { get; set; }
        
        // Boolean filters
        public bool? IsActive { get; set; }
        public bool? IsArchived { get; set; }
        public bool? IsOverdue { get; set; }
        
        // Numeric range filters
        public double? MinWorkload { get; set; }
        public double? MaxWorkload { get; set; }
        public int? MinProgress { get; set; }
        public int? MaxProgress { get; set; }
        
        // Custom filters (key-value pairs)
        public Dictionary<string, string>? CustomFilters { get; set; }
        
        // Include related data
        public bool IncludeAssignments { get; set; } = false;
        public bool IncludeTasks { get; set; } = false;
        public bool IncludeComments { get; set; } = false;
        public bool IncludeAttachments { get; set; } = false;
        
        public void ValidateAndSetDefaults()
        {
            if (PageNumber < 1) PageNumber = 1;
            if (PageSize < 1) PageSize = 20;
            if (PageSize > 1000) PageSize = 1000;
            
            // Validate date range
            if (DateFrom.HasValue && DateTo.HasValue && DateFrom > DateTo)
            {
                var temp = DateFrom;
                DateFrom = DateTo;
                DateTo = temp;
            }
            
            // Validate numeric ranges
            if (MinWorkload.HasValue && MaxWorkload.HasValue && MinWorkload > MaxWorkload)
            {
                var temp = MinWorkload;
                MinWorkload = MaxWorkload;
                MaxWorkload = temp;
            }
            
            if (MinProgress.HasValue && MaxProgress.HasValue && MinProgress > MaxProgress)
            {
                var temp = MinProgress;
                MinProgress = MaxProgress;
                MaxProgress = temp;
            }
        }
    }

    public class ProjectFilterDto : AdvancedFilterDto
    {
        // Project-specific filters
        public List<string>? ApprovalStatuses { get; set; }
        public bool? HasScrumMaster { get; set; }
        public bool? HasTeamMembers { get; set; }
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? IsNearDeadline { get; set; } // Within 7 days
        public bool? HasIssues { get; set; }
        public bool? HasMilestones { get; set; }
    }

    public class TaskFilterDto : AdvancedFilterDto
    {
        // Task-specific filters
        public List<int>? ProjectIds { get; set; }
        public List<int>? MilestoneIds { get; set; }
        public List<string>? TaskTypes { get; set; }
        public List<string>? TaskStatuses { get; set; }
        public bool? IsAssigned { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? IsNearDeadline { get; set; }
        public bool? HasDependencies { get; set; }
        public bool? HasComments { get; set; }
        public bool? HasAttachments { get; set; }
    }

    public class AssignmentFilterDto : AdvancedFilterDto
    {
        // Assignment-specific filters
        public List<int>? ProjectIds { get; set; }
        public List<string>? MemberRoles { get; set; }
        public List<string>? AssignmentStatuses { get; set; }
        public bool? IsPrimaryScrumMaster { get; set; }
        public bool? IsActive { get; set; }
        public double? MinWorkloadPercentage { get; set; }
        public double? MaxWorkloadPercentage { get; set; }
        public DateTime? AssignmentStartDateFrom { get; set; }
        public DateTime? AssignmentStartDateTo { get; set; }
        public DateTime? AssignmentEndDateFrom { get; set; }
        public DateTime? AssignmentEndDateTo { get; set; }
    }

    public class IssueFilterDto : AdvancedFilterDto
    {
        // Issue-specific filters
        public List<int>? ProjectIds { get; set; }
        public List<string>? IssueTypes { get; set; }
        public List<string>? IssueStatuses { get; set; }
        public List<string>? Priorities { get; set; }
        public List<string>? AssignedToUserIds { get; set; }
        public List<string>? ReportedByUserIds { get; set; }
        public bool? IsResolved { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? HasAttachments { get; set; }
        public bool? HasComments { get; set; }
    }

    public class CascadedFilterDto
    {
        public string? PrimaryFilter { get; set; }
        public string? SecondaryFilter { get; set; }
        public string? TertiaryFilter { get; set; }
        public Dictionary<string, object>? FilterValues { get; set; }
        public bool EnableCascading { get; set; } = true;
    }

    public class FilterOptionDto
    {
        public string Field { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "text", "select", "multiselect", "date", "range", "boolean"
        public List<string> Options { get; set; } = new List<string>();
        public bool IsRequired { get; set; } = false;
        public string? DefaultValue { get; set; }
        public string? Placeholder { get; set; }
        public string? HelpText { get; set; }
    }

    public class FilterResultDto<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
        public Dictionary<string, object>? AppliedFilters { get; set; }
        public List<FilterOptionDto>? AvailableFilters { get; set; }
    }
}
