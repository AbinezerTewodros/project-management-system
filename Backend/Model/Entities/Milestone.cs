using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Milestone
    {
        public bool IsDateRangeValid()
        {
            return DueDate >= StartDate;
        }

        public enum MilestoneStatus
        {
            Pending = 0,
            Planning = 1,
            InProgress = 2,
            OnHold = 3,
            Completed = 4,
            Cancelled = 5
        }

        [Key]
        public int MilestoneId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public string MilestoneName { get; set; }

        public string Description { get; set; }
        public string AssignedMemberId { get; set; }

        [ForeignKey("AssignedMemberId")]
        public ApplicationUser AssignedMember { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Range(0, 100)]
        public int Weight { get; set; }
        public MilestoneStatus Status { get; set; } = MilestoneStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        [Range(0, 100)]
        public double Progress { get; set; }
    }
}
