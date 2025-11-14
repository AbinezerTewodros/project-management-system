using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        public string FullName { get; set; } 
        
        [Required]
        public string EmployeeId { get; set; }
        
        [Required]
        public string Department { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        //public string? Manager { get; set; }
        
        [Required]
        public string Company { get; set; }

        public bool IsFirstLogin { get; set; } = true;
        public string Status { get; set; } = "Active"; // Active (true) or Inactive (false)
        // Common fields
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchiveDate { get; internal set; }
        public DateTime? LastLogin { get; set; }
        public DateTime? LastPasswordChange { get; set; }
        [Timestamp]
        public byte[]? Version { get; set; }
        
        public string? AccessToken { get; set; } //  Add this

        public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();

        // Org hierarchy
        public string? ReportsToUserId { get; set; }
        [ForeignKey("ReportsToUserId")]
        public virtual ApplicationUser? ReportsTo { get; set; }
        // Navigation properties for Escalations
        public virtual ICollection<EscalationUser> EscalationUsers { get; set; } = new List<EscalationUser>();
        public virtual ICollection<Escalation> ReceivedEscalations { get; set; } = new List<Escalation>();
        public virtual ICollection<Escalation> SentEscalations { get; set; } = new List<Escalation>();
        public virtual ICollection<ApplicationUser> DirectReports { get; set; } = new List<ApplicationUser>();
    }
}
