using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Model.Entities
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } // ID of the user who performed the action

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required, MaxLength(100)]
        public string EntityType { get; set; } // e.g., "ProjectTask", "TodoItem", "Project"

        public int EntityId { get; set; } // ID of the specific entity

        [Required, MaxLength(255)]
        public string ActionType { get; set; } // e.g., "Created", "Updated", "Deleted", "Assigned"

        [MaxLength(2000)]
        public string Details { get; set; } // Optional details about the change

        [MaxLength(100)]
        public string EntityName { get; set; } // Human-readable name of the entity (e.g., "Project: Website Redesign")

        // Enhanced field-level tracking
        public List<ActivityLogFieldChange> FieldChanges { get; set; } = new List<ActivityLogFieldChange>();

        // Additional context
        [MaxLength(50)]
        public string IpAddress { get; set; }

        [MaxLength(500)]
        public string UserAgent { get; set; }

        [MaxLength(100)]
        public string SessionId { get; set; }

        // Audit trail
        public string CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ActivityLogFieldChange
    {
        [Key]
        public int Id { get; set; }

        public int ActivityLogId { get; set; }
        public ActivityLog ActivityLog { get; set; }

        [Required, MaxLength(100)]
        public string FieldName { get; set; } // e.g., "Status", "Priority", "DueDate"

        [MaxLength(500)]
        public string OldValue { get; set; }

        [MaxLength(500)]
        public string NewValue { get; set; }

        [MaxLength(100)]
        public string FieldType { get; set; } // e.g., "string", "int", "DateTime", "enum"

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}