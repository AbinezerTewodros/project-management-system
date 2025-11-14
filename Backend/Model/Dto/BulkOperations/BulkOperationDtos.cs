using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.BulkOperations
{
    // Project Task Bulk Operations
    public class BulkProjectTaskUpdateDto
    {
        [Required]
        public int TaskId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Priority { get; set; }
        public string? Status { get; set; }
        public int? Weight { get; set; }
    }

    public class BulkTaskAssignmentDto
    {
        [Required]
        public int TaskId { get; set; }
        [Required]
        public string AssignedToUserId { get; set; }
        public DateTime? AssignedDate { get; set; }
    }

    public class BulkTaskStatusUpdateDto
    {
        [Required]
        public int TaskId { get; set; }
        [Required]
        public string Status { get; set; }
        public string? Comments { get; set; }
    }

    // Project Bulk Operations
    public class BulkProjectUpdateDto
    {
        [Required]
        public int ProjectId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
    }

    public class BulkProjectAssignmentDto
    {
        [Required]
        public int ProjectId { get; set; }
        [Required]
        public string UserId { get; set; }
        [Required]
        public string Role { get; set; }
        public DateTime? AssignedDate { get; set; }
    }

    // Issue Bulk Operations
    public class BulkIssueUpdateDto
    {
        [Required]
        public int IssueId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? Priority { get; set; }
        public string? Status { get; set; }
        public string? Type { get; set; }
    }

    public class BulkIssueAssignmentDto
    {
        [Required]
        public int IssueId { get; set; }
        [Required]
        public string AssignedToUserId { get; set; }
        public DateTime? AssignedDate { get; set; }
    }

    public class BulkIssueStatusUpdateDto
    {
        [Required]
        public int IssueId { get; set; }
        [Required]
        public string Status { get; set; }
        public string? Resolution { get; set; }
    }

    // Personal Todo Bulk Operations
    public class BulkPersonalTodoUpdateDto
    {
        [Required]
        public int TodoId { get; set; }
        public string? Task { get; set; }
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Priority { get; set; }
        public bool? EnableReminders { get; set; }
        public int? ReminderHoursBeforeDue { get; set; }
    }

    // Independent Task Bulk Operations
    public class BulkIndependentTaskUpdateDto
    {
        [Required]
        public int TaskId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Priority { get; set; }
        public string? Status { get; set; }
    }

    public class BulkIndependentTaskAssignmentDto
    {
        [Required]
        public int TaskId { get; set; }
        [Required]
        public string AssignedToUserId { get; set; }
        public DateTime? AssignedDate { get; set; }
    }

    // User Bulk Operations
    public class BulkUserRoleUpdateDto
    {
        [Required]
        public string UserId { get; set; }
        [Required]
        public string NewRole { get; set; }
        public string? Reason { get; set; }
    }

    // Generic Bulk Operations
    public class BulkExportRequestDto<T> where T : class
    {
        [Required]
        public string ExportType { get; set; }
        public List<string>? Fields { get; set; }
        public string? Format { get; set; } // CSV, Excel, JSON
        public string? FilterCriteria { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class BulkImportRequestDto<T> where T : class
    {
        [Required]
        public string ImportType { get; set; }
        [Required]
        public string FilePath { get; set; }
        public string? Format { get; set; }
        public bool? ValidateOnly { get; set; }
        public bool? SkipErrors { get; set; }
    }

    // Job Status and Results
    public class BulkJobStatusDto
    {
        public string JobId { get; set; }
        public string Status { get; set; } // Queued, Processing, Completed, Failed, Cancelled
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int TotalItems { get; set; }
        public int ProcessedItems { get; set; }
        public int SuccessfulItems { get; set; }
        public int FailedItems { get; set; }
        public string? ErrorMessage { get; set; }
        public double ProgressPercentage { get; set; }
        public string? ResultUrl { get; set; }
    }
}
