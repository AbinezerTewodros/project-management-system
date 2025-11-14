using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum MilestoneStatus
    {
        Pending = 0,
        Planning = 1,
        InProgress = 2,
        OnHold = 3,
        Completed = 4,
        Cancelled = 5
    }

    public enum MilestoneAssignmentStatus
    {
        Pending = 0,
        Accepted = 1,
        Rejected = 2
    }

    public class Milestone
    {
        public bool IsDateRangeValid()
        {
            return DueDate >= StartDate;
        }

        [Key]
        public int MilestoneId { get; set; }

        //[Required]
        //public string? MemberId { get; set; }
        
        // Role within this milestone (Lead, Contributor, Reviewer, etc.)
        //public string Role { get; set; } = "Contributor";
        //public bool IsLead { get; set; } = false;

        //public DateTime AssignedDate { get; set; } = DateTime.UtcNow;


        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public string MilestoneName { get; set; }

        public string Description { get; set; }
        public string? AssignedMemberId { get; set; }

        [ForeignKey("AssignedMemberId")]

        //public string? TeamMemberIds { get; set; } 
        public ApplicationUser? AssignedMember { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        [Required]
        public DateTime DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }

        [Range(0, 100)]
        public int Weight { get; set; }
        public MilestoneStatus Status { get; set; } = MilestoneStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        [Range(0, 100)]
        public double Progress { get; set; }

        // Assignment Approval Fields
        public MilestoneAssignmentStatus AssignmentStatus { get; set; } = MilestoneAssignmentStatus.Pending;
        public DateTime? AssignmentAcceptedDate { get; set; }
        public string? AssignmentRejectionReason { get; set; }

        public virtual ICollection<MilestoneMember> MilestoneMembers { get; set; } = new List<MilestoneMember>();
        public ICollection<Escalation> Escalations { get; set; }
    }
}
