using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Timeline
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; }
        public string? ProjectName { get; set; }
        public string? MilestoneName { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public DateTime CompletedDate { get; set; }
        public DateTime? EventTime { get; set; }  // New
        public string EventType { get; set; }     // New: e.g., "StatusChange"
        public string UserId { get; set; }   // New: FK to ApplicationUser

        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        public string Color { get; set; }

        [Required]
        public string RedirectUrl { get; set; }

        [Required]
        public string Status { get; set; } = "Pending";

        [Required]
        public string TimelineType { get; set; }  // e.g., "Project", "Task", "Comment", "ActivityLog", "Notification"
        public string Priority { get; set; }
        public int? Progress { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        public int? ParentTimelineId { get; set; }

        [ForeignKey("ParentTimelineId")]
        public Timeline ParentTimeline { get; set; }

        public ICollection<Timeline> SubTimelines { get; set; }
        public int? MilestoneId { get; set; }

        [ForeignKey("MilestoneId")]
        public Milestone Milestone { get; set; }

        public int? TaskId { get; set; }

        [ForeignKey("TaskId")]
        public ProjectTask Task { get; set; }

        public int? IndependentTaskId { get; set; }

        [ForeignKey("IndependentTaskId")]
        public IndependentTask IndependentTask { get; set; }

        public int? ProjectAssignmentId { get; set; }

        [ForeignKey("ProjectAssignmentId")]
        public ProjectAssignment ProjectAssignment { get; set; }

        //public ICollection<TimelineDependency> Dependencies { get; set; }

        // New fields for customized times
        public TimeSpan? LeadTime { get; set; } // Duration from request verification before project creation
        public TimeSpan? CycleTime { get; set; } // Duration after feasibility test
        //public ICollection<TimelinePhase> Phases { get; set; } // For takt times per phase
        public List<TimelinePhase> Phases { get; set; } = new List<TimelinePhase>();
        // Additional fields for time tracking
        public DateTime? RequestVerificationDate { get; set; } // Start of lead time
        public DateTime? FeasibilityTestDate { get; set; } // Start of cycle time
        //public DateTime? ProjectCreationDate { get; set; } // End of lead time, start of project
    }

    public class TimelinePhase
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string PhaseName { get; set; } // e.g., "Brainstorm", "Project Assignment", "Contacting 3rd Party", "Requirement Gathering"

        [Required]
        public TimeSpan Duration { get; set; } // Takt time (time taken) for this phase
        public TimeSpan TaktTime { get; set; }
        [MaxLength(50)]
        public string PhaseStatus { get; set; } = "NotStarted";

        public DateTime? PhaseStartDate { get; set; }
        public DateTime? PhaseEndDate { get; set; }

        public int TimelineId { get; set; }

        [ForeignKey("TimelineId")]
        public Timeline Timeline { get; set; }
        public int? Order { get; set; } // Order of the phase in the timeline
    }

    //public class TimelineDependency
    //{
    //    [Key]
    //    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    //    public int Id { get; set; }

    //    [Required]
    //    public int TimelineId { get; set; }

    //    [ForeignKey("TimelineId")]
    //    public Timeline Timeline { get; set; }

    //    [Required]
    //    public int DependencyId { get; set; }

    //    [ForeignKey("DependencyId")]
    //    public Timeline Dependency { get; set; }

    //    public string Type { get; set; }

    //    // Independent Task
    //    public int? DependentIndependentTaskId { get; set; } // Changed to nullable
    //    public int? PrerequisiteIndependentTaskId { get; set; } // Changed to nullable

    //    [ForeignKey("DependentIndependentTaskId")]
    //    public IndependentTask DependentIndependentTask { get; set; }

    //    [ForeignKey("PrerequisiteIndependentTaskId")]
    //    public IndependentTask PrerequisiteIndependentTask { get; set; }

    //    // Project Task
    //    public int? DependentProjectTaskId { get; set; } // Changed to nullable
    //    public int? PrerequisiteProjectTaskId { get; set; } // Changed to nullable

    //    [ForeignKey("DependentProjectTaskId")]
    //    public ProjectTask DependentProjectTask { get; set; }

    //    [ForeignKey("PrerequisiteProjectTaskId")]
    //    public ProjectTask PrerequisiteProjectTask { get; set; }

    //    // Milestone
    //    public int? DependentMilestoneId { get; set; } // Changed to nullable
    //    public int? PrerequisiteMilestoneId { get; set; } // Changed to nullable

    //    [ForeignKey("DependentMilestoneId")]
    //    public Milestone DependentMilestone { get; set; }

    //    [ForeignKey("PrerequisiteMilestoneId")]
    //    public Milestone PrerequisiteMilestone { get; set; }
    //}

    public enum TimelinePhaseType
    {
        Brainstorm,
        ProjectAssignment,
        ContactingThirdParty,
        RequirementGathering,
        Development,
        Testing,
        Deployment,
        Review
    }
    //public enum TimelineDependencyType
    //{
    //    FinishTostart,
    //    StartToFinish
    //}
}