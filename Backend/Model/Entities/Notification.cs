using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum NotificationDeliveryMethod
    {
        Email,
        InApp
    }

    public enum NotificationStatus
    {
        Pending,
        Sent,
        Failed
    }

    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RecipientUserId { get; set; } // ID of the user who should receive the notification

        [Required, MaxLength(255)]
        public string Subject { get; set; }

        [Required, MaxLength(2000)]
        public string Message { get; set; }

        [Required, MaxLength(100)]
        public string RelatedEntityType { get; set; } // e.g., "TodoItem", "ProjectTask"

        public int RelatedEntityId { get; set; } // ID of the specific entity the notification is about

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public NotificationStatus Status { get; set; } = NotificationStatus.Pending;

        [Required]
        public NotificationDeliveryMethod DeliveryMethod { get; set; }

        public DateTime? ScheduledSendTime { get; set; } // For reminders, the time to send

        public DateTime? SentAt { get; set; }

        public string? FailureReason { get; set; }
    }
}