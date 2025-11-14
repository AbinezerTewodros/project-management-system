using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Models.Enums; // ✅ Add this using

namespace ProjectManagementSystem1.Models.Entities.ProjectRequestEntities
{
    public class ProjectRequest
    {
        [Key]
        public int Id { get; set; }

        // Core Identification Fields
        [Required]
        [StringLength(12)]
        public string RequestID { get; set; } = string.Empty; // ✅ Initialize

        [StringLength(15)]
        public string? ReferenceNo { get; set; }

        [Required]
        [StringLength(200)]
        public string RequestTitle { get; set; } = string.Empty; // ✅ Initialize

        [Required]
        public string RequestDescription { get; set; } = string.Empty; // ✅ Initialize

        // Requestor & Origin Details
        [Required]
        [StringLength(50)]
        public string RequestedBy { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string RequestedByName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string BusinessSector { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string BusinessDivision { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string BusinessDepartment { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string OrganizationName { get; set; } = "Commercial Bank of Ethiopia";

        [Required]
        [EmailAddress]
        [StringLength(30)]
        public string PrimaryContactEmail { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(30)]
        public string? SecondaryContactEmail { get; set; }

        [Required]
        [StringLength(15)]
        public string PrimaryContactPhone { get; set; } = string.Empty;

        [StringLength(15)]
        public string? SecondaryContactPhone { get; set; }

        // Classification & Metadata
        [Required]
        public RequestType RequestType { get; set; }

        [Required]
        public RequestCategory RequestCategory { get; set; }

        [Required]
        public ServiceCategory ServiceCategory { get; set; }

        [Required]
        public ProductCategory ProductCategory { get; set; }

        [Required]
        public PriorityLevel PriorityLevel { get; set; }

        [Required]
        public ImpactUrgencyLevel BusinessImpact { get; set; }

        [Required]
        public ImpactUrgencyLevel RequestUrgency { get; set; }

        [Required]
        [StringLength(100)]
        public string StrategicAlignment { get; set; } = string.Empty;

        [Precision(18, 2)]
        public decimal? EstimatedCost { get; set; }

        [Precision(18, 2)]
        public decimal? EstimatedBenefit { get; set; }
        public int? BenefitCaptureDuration { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public ImpactUrgencyLevel? RiskLevel { get; set; }
        public ImpactUrgencyLevel? ComplexityLevel { get; set; }

        // Evaluation & Scoring
        [StringLength(50)]
        public string? EvaluatorID { get; set; }
        public int? FeasibilityScore { get; set; }
        public int? BusinessValueScore { get; set; }
        public int? TechnicalComplexityScore { get; set; }

        [Precision(18, 2)]
        public decimal? TotalScore { get; set; }
        public string? EvaluationRemarks { get; set; }

        // Workflow & Status Tracking
        [Required]
        public RequestStatus Status { get; set; } = RequestStatus.Submitted;

        public WorkflowStage? WorkflowStage { get; set; }

        [StringLength(100)]
        public string? AssignedTeam { get; set; }

        [StringLength(50)]
        public string? AssignedTo { get; set; }

        // Audit Fields
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdatedDate { get; set; } = DateTime.UtcNow;

        [StringLength(50)]
        public string CreatedBy { get; set; } = string.Empty;

        [StringLength(50)]
        public string LastUpdatedBy { get; set; } = string.Empty;

        public DateTime? ApprovalDate { get; set; }

        // ✅ FIXED: Navigation Properties - use virtual for lazy loading
        public virtual ICollection<ProjectRequestAttachment> Attachments { get; set; } = new List<ProjectRequestAttachment>();
        public virtual ICollection<ProjectRequestComment> Comments { get; set; } = new List<ProjectRequestComment>();
        public virtual ICollection<ProjectRequestFeedback> Feedbacks { get; set; } = new List<ProjectRequestFeedback>();
        public virtual ICollection<ProjectRequestWorkflowHistory> WorkflowHistories { get; set; } = new List<ProjectRequestWorkflowHistory>();
        public virtual ICollection<ProjectRequestStatusHistory> StatusHistories { get; set; } = new List<ProjectRequestStatusHistory>();
        public virtual ICollection<ProjectRequestOwnerHistory> OwnerHistories { get; set; } = new List<ProjectRequestOwnerHistory>();

        // Computed property
        [NotMapped]
        public int RequestDurationDays => (DateTime.UtcNow - CreatedDate).Days;
    }
}