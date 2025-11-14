using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Dto.TimelineDto
{
    public class TimelineDto
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? EventTime { get; set; }  //For event timestamp

        [Required]
        public string Status { get; set; }
        [Required]
        public string TimelineType { get; set; }
        public string EventType { get; set; }
        public string Priority { get; set; }
        public int? Progress { get; set; }

        public string RedirectUrl { get; set; }
        public int? RelatedEntityId { get; set; }
        [Required]
        public int? ProjectId { get; set; }
        public string Color { get; set; }
        public string UserId { get; set; }  // New: User who triggered the event
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        // New fields for time tracking
        public TimeSpan? LeadTime { get; set; }
        public TimeSpan? CycleTime { get; set; }
        public List<TimelinePhaseDto> Phases { get; set; } = new List<TimelinePhaseDto>();
        public DateTime? RequestVerificationDate { get; set; }
        public DateTime? FeasibilityTestDate { get; set; }

        //// Calculated properties
        //public TimeSpan? TotalTaktTime { get; set; }
        //public TimeSpan? TotalDuration { get; set; }
    }

    public class TimelinePhaseDto
    {
        public int Id { get; set; }
        [Required]
        public string PhaseName { get; set; }
        //public TimeSpan? TaktTime { get; set; }
        public TimeSpan Duration { get; set; }
        public DateTime? PhaseStartDate { get; set; }
        public DateTime? PhaseEndDate { get; set; }
        public int TimelineId { get; set; }
        public string PhaseStatus { get; set; }
        public int? Order { get; set; }
    }

    public class UpdateTimelineTimesDto
    {
        public DateTime? RequestVerificationDate { get; set; }
        public DateTime? FeasibilityTestDate { get; set; }
        public DateTime? ProjectStartDate { get; set; }
        public DateTime? ProjectCompletionDate { get; set; }
    }

    public class UpdatePhaseDto
    {
        [Required]
        public string PhaseName { get; set; }
        public DateTime? PhaseStartDate { get; set; }
        public DateTime? PhaseEndDate { get; set; }
        public string PhaseStatus { get; set; }
    }

    public class AddTimelinePhaseDto
    {
        [Required]
        public string PhaseName { get; set; }
        public TimeSpan Duration { get; set; }
        public DateTime? PhaseStartDate { get; set; }
        public DateTime? PhaseEndDate { get; set; }
        public string PhaseStatus { get; set; }
    }

    //public class TimeAnalysisDto
    //{
    //    public int TimelineId { get; set; }
    //    public string Title { get; set; }
    //    public TimeSpan? LeadTime { get; set; }
    //    public TimeSpan? CycleTime { get; set; }
    //    public TimeSpan? TotalTaktTime { get; set; }
    //    public TimeSpan? TotalDuration { get; set; }
    //    public TimeSpan AverageTaktTime { get; set; }
    //    public int CompletedPhasesCount { get; set; }
    //    public int TotalPhasesCount { get; set; }
    //    public double EfficiencyPercentage { get; set; }
    //    public double EfficiencyScore { get; set; }
    //    public TimeSpan Duration { get; set; }
    //    public double PercentageOfTotal { get; set; }
    //    public bool IsBottleneck { get; set; }
    //    public List<TimelinePhaseAnalysisDto> PhaseAnalysis { get; set; } = new List<TimelinePhaseAnalysisDto>();
    //}
    //public class TimelinePhaseAnalysisDto
    //{
    //    public string PhaseName { get; set; }
    //    public TimeSpan Duration { get; set; }
    //    public double PercentageOfTotal { get; set; }
    //    public bool IsBottleneck { get; set; }
    //}

    public class AddDependenciesDto
    {
        [Required]
        public List<int> DependencyIds { get; set; }
        public string TimelineDependencyType { get; set; } = "FinishToStart";
    }

    public enum TimelineFormat
    {
        Json,
        Csv,
        Excel,
        Pdf
    }

    public enum TimelineFilter
    {
        All,
        ByStatus,
        ByType,
        ByPriority,
        ByDateRange
    }

    public enum TimelineType
    {
        ProjectTask,
        Milestone,
        Project,
        IndependentTask,
        ActivityLog,
        Comment,
        Notification,
        Escalation,
        Message,
        DependencyUpdate
    }
}