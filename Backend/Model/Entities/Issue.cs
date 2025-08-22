using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum IssueStatus
    {
        Open,
        InProgress,
        Closed,
        Reopened
    }

    public enum IssuePriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum IssueType
    {
        Bug,
        Feature,
        Enhancement,
        Documentation,
        Performance,
        Security,
        Usability,
        Other
    }

    public class Issue
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(250)]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        public IssueStatus Status { get; set; } = IssueStatus.Open;

        [Required]
        public IssuePriority Priority { get; set; } = IssuePriority.Medium;

        [Required]
        public IssueType Type { get; set; } = IssueType.Other;

        public int PriorityValue
        {
            get => (int)Priority;
            set => Priority = (IssuePriority)value;
        }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Foreign key for assignee (assuming a User entity exists)
        public string? AssigneeId { get; set; }
        [ForeignKey("AssigneeId")]
        public virtual ApplicationUser? Assignee { get; set; }

        // Foreign key for reporter 
        [Required]
        public string? ReporterId { get; set; }
        [ForeignKey("ReporterId")]
        public virtual ApplicationUser? Reporter { get; set; } // Navigation property
        public int? ProjectId { get; set; } // The foreign key property
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; } // The navigation property

        //Foreign Key for ProjectTask
        public int? ProjectTaskId { get; set; } // The foreign key property
        [ForeignKey("ProjectTaskId")]
        public virtual ProjectTask? ProjectTask { get; set; } // The navigation property

        //Foreign Key for IndependentTask
        public int? IndependentTaskId { get; set; } // The foreign key property
        [ForeignKey("IndependentTaskId")]
        public virtual IndependentTask? IndependentTask { get; set; }

        public virtual ICollection<ProjectTask> ProjectTasks { get; set; } // Navigation property for ProjectTasks
        public virtual ICollection<IndependentTask> IndependentTasks { get; set; } // Navigation property for IndependentTasks
    }
}