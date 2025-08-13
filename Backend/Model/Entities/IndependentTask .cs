using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    //public enum IndependentTaskStatus { NotStarted, InProgress, OnHold, Completed, Cancelled}
    public class IndependentTask
    {
        [Key]
        public int TaskId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "NotStarted";

        [Range(0, 100)]
        public double Progress { get; set; } = 0;

        [Range(1, 100)]
        public int Weight { get; set; } = 0;

        [Required]
        [ForeignKey("CreatedByUser")]
        public string CreatedByUserId { get; set; }

        [Required]
        [ForeignKey("AssignedToUser")]
        public string AssignedToUserId { get; set; }

        public static readonly string[] AllowedStatuses =
        {
        "Not Started", "In Progress", "Completed", "On Hold", "Cancelled"
        };
        // Navigation properties
        public virtual ApplicationUser CreatedByUser { get; set; }
        public virtual ApplicationUser AssignedToUser { get; set; }
        public int? IssueId { get; set; } // Foreign key to Issue
        public virtual Issue Issue { get; set; } // Navigation property
    }
}