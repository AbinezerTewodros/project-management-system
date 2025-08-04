using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

public class ProjectAssignment
{
    public enum AssignmentStatus
    {
        Pending,
        Approved,
        Rejected
    }

    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [ForeignKey("ProjectId")]
    public Project Project { get; set; }

    [Required]
    public string MemberId { get; set; }

    [ForeignKey("MemberId")]
    public ApplicationUser Member { get; set; }

    [Required]
    public string MemberRole { get; set; }

    public string? Role { get; set; } // e.g., "ScrumMaster", "TeamLeader", "Member"

    //public double Status { get; set; } = 0;

    // Audit fields
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedDate { get; set; }
    public string? CreateUser { get; set; }
    public string? UpdateUser { get; set; }

    [Timestamp]
    public byte[] Version { get; set; }

    public AssignmentStatus Status { get; set; } = AssignmentStatus.Pending;
    public string? ApprovedById { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>(); // navigation property
}