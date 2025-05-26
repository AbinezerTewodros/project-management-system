using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum TaskStatus { Pending, Accepted, Rejected }
    public enum TaskPriority { Low, Medium, High, Critical }

    public class ProjectTask : IValidatableObject
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        public string Description;

        [Required]
        public int ProjectAssignmentId { get; set; }

        public ProjectAssignment ProjectAssignment { get; set; }

        public string? AssignedMemberId { get; set; }

        public int? ParentTaskId { get; set; }
        [ForeignKey("ParentTaskId")]
        public ProjectTask? ParentTask { get; set; }
        public ICollection<ProjectTask> SubTasks { get; set; } = new List<ProjectTask>();

        // Auto-calculated hierarchy properties
        public int Depth { get; private set; }
        public bool IsLeaf { get; private set; } = true;

        // Manual input fields
        [Required, Range(1, 100)]
        public int Weight { get; set; }
        public double? ActualHours { get; set; }

        //[Required]
        public TaskPriority Priority { get; set; }

        //public int? ProjectGoalId { get; set; }

        //[ForeignKey("ProjectGoalId")]
        //public ProjectGoal? ProjectGoal { get; set; }

        // Progress logic
        private double _progress;
        [Range(0, 100)]
        public double Progress
        {
            get
            {
                if (SubTasks != null  && SubTasks.Any())
                {
                    return SubTasks.Average(st => st.Progress);
                }
                else
                {
                    return 0;
                }
            }
            set
            {
                if (!IsLeaf)
                    throw new InvalidOperationException("Progress can only be set on leaf tasks");

                _progress = value;
            }
            //set => _progress = value; // Only stored for leaf nodes
        }

        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public double EstimatedHours { get; set; }

        public DateTime? DueDate { get; set; }
        public string? RejectionReason { get; set; }
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Status == TaskStatus.Rejected && string.IsNullOrWhiteSpace(AssignedMemberId))
                yield return new ValidationResult("Rejecting member must be specified", [nameof(AssignedMemberId)]);

            if ((Priority == TaskPriority.High || Priority == TaskPriority.Critical) && !DueDate.HasValue)
                yield return new ValidationResult("High/Critical tasks require due dates", [nameof(DueDate)]);

            //if (ParentTask != null && Depth != ParentTask.Depth + 1)
            //    yield return new ValidationResult("Depth miscalculation", [nameof(Depth)]);
        }

        public void UpdateHierarchy()
        {
            
            Depth = ParentTask?.Depth + 1 ?? 0;

            // A task is a leaf only if it has no subtasks at this point in time.
            IsLeaf = !SubTasks.Any();

            // Propagate upward
            //ParentTask?.UpdateHierarchy(); // Propagate changes upward

            // Propagate downward (to update children's Depth)
            if (SubTasks != null)
            {
                foreach (var subtask in SubTasks)
                {
                    // Ensure subtask's ParentTask reference is this instance for correct depth calculation
                    if (subtask.ParentTask != this) subtask.ParentTask = this;
                    subtask.UpdateHierarchy();
                }
            }
        }
    }
}