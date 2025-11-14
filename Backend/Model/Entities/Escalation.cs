using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto.EscalationDto;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Escalation
    {
        [Key]
        public int Id { get; set; }

        public string Title { get; set; }

        [Required]
        public string Content { get; set; }

        public string Type { get; set; }
        public EscalationStatus Status { get; set; } = EscalationStatus.Active;

        public int? MilestoneId { get; set; }
        [ForeignKey("MilestoneId")]
        public virtual Milestone Milestone { get; set; }

        public int? ProjectId { get; set; }
        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        public int? ProjectTaskId { get; set; }
        [ForeignKey("ProjectTaskId")]
        public virtual ProjectTask ProjectTask { get; set; }

        public int? IndependentTaskId { get; set; }
        [ForeignKey("IndependentTaskId")]
        public virtual IndependentTask IndependentTask { get; set; }

        [Required]
        public string SenderId { get; set; }
        [ForeignKey("SenderId")]
        public virtual ApplicationUser Sender { get; set; }

        // Many-to-many relationship with Users (Receivers) using join entity
        public virtual ICollection<EscalationUser> EscalationUsers { get; set; } = new List<EscalationUser>();

        // Navigation property for convenience (mapped through EscalationUsers)
        public virtual ICollection<ApplicationUser> Receiver { get; set; } = new List<ApplicationUser>();

        public Guid? AttachmentId { get; set; }
        public DateTime TimeSent { get; set; } = DateTime.UtcNow;
        public DateTime? TimeEdited { get; set; }
        public DateTime ResponseTimeLimit { get; set; }

        [Column(TypeName = "bit")] // FIX: Explicitly map to SQL Server bit type
        public bool IsRead { get; set; } = false;

        public int? ParentEscalationId { get; set; }
        [ForeignKey("ParentEscalationId")]
        public virtual Escalation ParentEscalation { get; set; }

        // Updated: Added EscalationLevel to track how many times the escalation has been forwarded
        public int EscalationLevel { get; set; } = 0; // 0 = initial escalation, 1 = first manager level, etc.

        public virtual ICollection<EscalationReply> EscalationReplies { get; set; } = new List<EscalationReply>();

        [Timestamp]
        public byte[] Version { get; set; }
    }

    public class EscalationUser
    {
        // Remove the Id property and use composite key instead
        [Key]
        [Column(Order = 1)]
        public int EscalationId { get; set; }

        [Key]
        [Column(Order = 2)]
        public string UserId { get; set; } = string.Empty;

        [Column(TypeName = "bit")]
        public bool IsRead { get; set; } = false;

        // Navigation properties
        [ForeignKey("EscalationId")]
        public virtual Escalation Escalation { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
    }

    public class EscalationReply
    {
        [Key]
        public int Id { get; set; }

        public int EscalationId { get; set; }
        [ForeignKey("EscalationId")]
        public virtual Escalation Escalation { get; set; }

        public string Content { get; set; }
        // Clear separation of sender and receiver
        public string SenderId { get; set; } = string.Empty; // Who sent this reply
        [ForeignKey("SenderId")]
        public virtual ApplicationUser Sender { get; set; } // Who sent the reply
        public string ReceiverId { get; set; } = string.Empty; // Who receives this reply (escalation sender)
        [ForeignKey("ReceiverId")]
        public virtual ApplicationUser Receiver { get; set; } // Who receives the reply

        [Column(TypeName = "bit")] // FIX: Explicitly map to SQL Server bit type
        public bool IsRead { get; set; } = false;

        public DateTime TimeSent { get; set; } = DateTime.UtcNow;
    }

    public enum EscalationReadStatus
    {
        Unread,
        Read
    }

    public enum EscalationStatus
    {
        Active,        // Initial state - waiting for response
        Responded,     // Someone has replied to the escalation
        Escalated,     // Has been escalated to manager level
        Resolved,      // Issue has been resolved
        Closed         // Escalation is closed without resolution
    }
}