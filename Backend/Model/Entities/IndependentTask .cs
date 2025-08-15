using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum IndependentTaskStatus { Pending, Accepted, Rejected, InProgress, WaitingReview, Approved, Reopened, Cancelled}
    public enum IndependentTaskPriority { Low, Medium, High, Critical }

    public class TaskStatusHistory
    {
        public int Id { get; set; }

        [ForeignKey("Task")]
        public int TaskId { get; set; }

        public IndependentTaskStatus OldStatus { get; set; }
        public IndependentTaskStatus NewStatus { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ChangedBy")]
        public string ChangedById { get; set; }
        public string ChangeReason { get; set; }

        public virtual IndependentTask Task { get; set; }
        public virtual ApplicationUser ChangedBy { get; set; }
    }

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
        public DateTime? StartDate {  get; set; }
        public DateTime? CompletedDate { get; set; }
        
        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public IndependentTaskStatus Status { get; set; } = IndependentTaskStatus.Pending;

        [Range(0, 100)]
        public double Progress { get; set; } = 0;

        [Range(1, 100)]
        public int Weight { get; set; } = 0;

        public string RejectionReason { get; set; }
        public string CompletionDetails { get; set; }

        public string LateCompletionReason { get; set; }
        public string ApprovalComments { get; set; }
        public string ReopenReason { get; set; }
        public IndependentTaskPriority Priority { get; set; } = IndependentTaskPriority.Medium;

        [Required]
        [ForeignKey("CreatedByUser")]
        public string CreatedByUserId { get; set; }

        [Required]
        [ForeignKey("AssignedToUser")]
        public string AssignedToUserId { get; set; }

        // Navigation properties
        public virtual ApplicationUser CreatedByUser { get; set; }
        public virtual ApplicationUser AssignedToUser { get; set; }
        public virtual ICollection<Comment> Comments { get; set; }
        public virtual ICollection<Attachment> Attachments { get; set; }
        public virtual ICollection<TaskStatusHistory> StatusHistory { get; set; }
        public int? IssueId { get; set; } // Foreign key to Issue
        public virtual Issue Issue { get; set; } // Navigation property
    }
}