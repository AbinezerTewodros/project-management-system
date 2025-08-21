using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.ProjectDto
{
    public class ProjectApprovalDto
    {
        public int ProjectId { get; set; }
        public ProjectApprovalStatus Status { get; set; }
        public string? Notes { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class ProjectApprovalRequestDto
    {
        public int ProjectId { get; set; }
        public string ApproverUserId { get; set; } = string.Empty;
        public ProjectApprovalStatus Status { get; set; }
        public string? Notes { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class ProjectApprovalResponseDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public ProjectApprovalStatus Status { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string? Notes { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class PendingProjectApprovalDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string ProjectOwner { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
    }
}
