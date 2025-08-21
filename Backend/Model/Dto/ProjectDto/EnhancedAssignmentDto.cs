using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.ProjectDto
{
    public class EnhancedAssignmentDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string MemberName { get; set; } = string.Empty;
        public string MemberEmail { get; set; } = string.Empty;
        public string MemberRole { get; set; } = string.Empty;
        public string? Role { get; set; }
        public ProjectAssignment.AssignmentStatus Status { get; set; }
        public bool IsPrimaryScrumMaster { get; set; }
        public double WorkloadPercentage { get; set; }
        public DateTime? AssignmentStartDate { get; set; }
        public DateTime? AssignmentEndDate { get; set; }
        public string? AssignmentNotes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
    }

    public class CreateEnhancedAssignmentDto
    {
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public string MemberId { get; set; } = string.Empty;
        
        [Required]
        public string MemberRole { get; set; } = string.Empty;
        
        public string? Role { get; set; }
        public bool IsPrimaryScrumMaster { get; set; } = false;
        
        [Range(1, 100, ErrorMessage = "Workload percentage must be between 1 and 100")]
        public double WorkloadPercentage { get; set; } = 100.0;
        
        public DateTime? AssignmentStartDate { get; set; }
        public DateTime? AssignmentEndDate { get; set; }
        public string? AssignmentNotes { get; set; }
    }

    public class UpdateAssignmentDto
    {
        public string? MemberRole { get; set; }
        public string? Role { get; set; }
        public bool? IsPrimaryScrumMaster { get; set; }
        
        [Range(1, 100, ErrorMessage = "Workload percentage must be between 1 and 100")]
        public double? WorkloadPercentage { get; set; }
        
        public DateTime? AssignmentStartDate { get; set; }
        public DateTime? AssignmentEndDate { get; set; }
        public string? AssignmentNotes { get; set; }
        public bool? IsActive { get; set; }
    }

    public class MemberAvailabilityDto
    {
        public string MemberId { get; set; } = string.Empty;
        public string MemberName { get; set; } = string.Empty;
        public string MemberEmail { get; set; } = string.Empty;
        public double TotalWorkloadPercentage { get; set; }
        public int ActiveProjectCount { get; set; }
        public List<ProjectWorkloadDto> ProjectWorkloads { get; set; } = new List<ProjectWorkloadDto>();
        public double AvailableWorkloadPercentage { get; set; }
        public bool IsOverloaded { get; set; }
    }

    public class ProjectWorkloadDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string MemberRole { get; set; } = string.Empty;
        public double WorkloadPercentage { get; set; }
        public DateTime? AssignmentStartDate { get; set; }
        public DateTime? AssignmentEndDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class ReassignmentRequestDto
    {
        [Required]
        public int AssignmentId { get; set; }
        
        [Required]
        public string NewMemberId { get; set; } = string.Empty;
        
        public string? Reason { get; set; }
        public DateTime? EffectiveDate { get; set; }
        public string? Notes { get; set; }
    }

    public class MultipleScrumMasterDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public List<ScrumMasterDto> ScrumMasters { get; set; } = new List<ScrumMasterDto>();
    }

    public class ScrumMasterDto
    {
        public string MemberId { get; set; } = string.Empty;
        public string MemberName { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public double WorkloadPercentage { get; set; }
        public DateTime? AssignmentStartDate { get; set; }
        public DateTime? AssignmentEndDate { get; set; }
    }
}
