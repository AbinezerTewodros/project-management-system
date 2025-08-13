using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum TaskStatus { Pending, Accepted, Rejected, Completed, InProgress, WaitingForReview } // Re-add this
    public enum TaskPriority { Low, Medium, High, Critical }

    public class ProjectTask : IValidatableObject
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string? Description;

        [Required]
        public int ProjectAssignmentId { get; set; }

        [ForeignKey("ProjectAssignmentId")]
        public ProjectAssignment ProjectAssignment { get; set; }

        public int? MilestoneId { get; set; }

        [ForeignKey("MilestoneId")]
        public virtual Milestone Milestone { get; set; }
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
        public string? RejectionReason { get; set; }
        public TaskPriority Priority { get; set; }

        private double _progress;
        [Range(0, 100)]
        public double Progress
        {
            get => _progress;
            internal set
            {
                if (!IsLeaf && value != _progress)
                {
                    throw new InvalidOperationException("Progress can only be set on leaf tasks");
                }
                _progress = value;
            }
        }

        public DateTime? AcceptedDate { get; set; }
        public bool IsProjectRoot { get; set; } = false;
        public TaskStatus Status { get; set; } = TaskStatus.Pending; // Re-add this with a default value

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public double EstimatedHours { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsAutoCreateTodo { get; set; } // Default to true
        public ICollection<TodoItem> TodoItems { get; set; } = new List<TodoItem>();
        public ICollection<ProjectTask> Dependencies { get; set; } = new List<ProjectTask>();
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (MilestoneId != null && !IsWithinMilestoneDates())
            {
                yield return new ValidationResult(
                    "Task dates must fall within milestone date range",
                    new[] { nameof(StartDate), nameof(DueDate) });
            }

            if ((Priority == TaskPriority.High || Priority == TaskPriority.Critical) && !DueDate.HasValue)
                yield return new ValidationResult("High/Critical tasks require due dates", [nameof(DueDate)]);
        }

        public bool IsWithinMilestoneDates()
        {
            if (MilestoneId == null) return true;

            return (!StartDate.HasValue || StartDate >= Milestone.StartDate) &&
                   (!DueDate.HasValue || DueDate <= Milestone.DueDate);
        }

        
        public void UpdateHierarchy()
        {

            Depth = ParentTask?.Depth + 1 ?? 0;
            IsLeaf = !SubTasks.Any() && !TodoItems.Any();

            if (SubTasks != null)
            {
                foreach (var subtask in SubTasks)
                {
                    subtask.ParentTask = this;
                    subtask.UpdateHierarchy();
                }
            }
        }

        public void SetCalculatedProgress(double progress)
        {
            _progress = progress;
        }
        public int? IssueId { get; set; } // Foreign key to Issue
        public virtual Issue Issue { get; set; } // Navigation property
    }
}