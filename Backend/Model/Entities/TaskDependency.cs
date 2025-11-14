using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum DependencyType
    {
        FinishToStart,    // Task B cannot start until Task A finishes
        StartToStart,     // Task B cannot start until Task A starts
        FinishToFinish,   // Task B cannot finish until Task A finishes
        StartToFinish     // Task B cannot finish until Task A starts
    }

    public class TaskDependency
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PredecessorTaskId { get; set; }

        [Required]
        public int SuccessorTaskId { get; set; }

        [Required]
        public DependencyType DependencyType { get; set; } = DependencyType.FinishToStart;

        public int? LagDays { get; set; } // Optional delay between tasks

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string CreatedByUserId { get; set; }

        // Navigation properties
        [ForeignKey("PredecessorTaskId")]
        public virtual ProjectTask PredecessorTask { get; set; }

        [ForeignKey("SuccessorTaskId")]
        public virtual ProjectTask SuccessorTask { get; set; }

        [ForeignKey("CreatedByUserId")]
        public virtual ApplicationUser CreatedBy { get; set; }

        // Validation to prevent circular dependencies
        public bool IsCircularDependency()
        {
            // This would be implemented in the service layer
            // to check if adding this dependency would create a cycle
            return false;
        }
    }
}
