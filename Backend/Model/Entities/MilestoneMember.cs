using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class MilestoneMember
    {
        [Key]
        public int Id { get; set; }  // Primary key for the junction table

        [Required]
        public int MilestoneId { get; set; }

        [Required]
        public string MemberId { get; set; }

        // Role within this milestone (Lead, Developer, Tester, etc.)
        public string Role { get; set; } = "Contributor";

        // Is this member the lead for this milestone?
        public bool IsLead { get; set; } = false;

        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        // Individual assignment status for each member
        public MilestoneAssignmentStatus AssignmentStatus { get; set; } = MilestoneAssignmentStatus.Pending;

        public DateTime? AssignmentAcceptedDate { get; set; }
        public string? AssignmentRejectionReason { get; set; }

        // Navigation properties
        [ForeignKey("MilestoneId")]
        public Milestone Milestone { get; set; }

        [ForeignKey("MemberId")]
        public ApplicationUser Member { get; set; }
    }
}
