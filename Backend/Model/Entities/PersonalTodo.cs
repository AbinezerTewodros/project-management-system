using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum PersonalTodoPriority { Low, Medium, High, Critical }
    public enum PersonalTodoStatus { Pending, InProgress, Completed, Overdue, Cancelled }

    public class PersonalTodo
    {
        [Key]
        public int TodoId { get; set; }

        [Required]
        public string UserId { get; set; } // FK to ApplicationUser
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        [Required]
        [MaxLength(500)]
        public string Task { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        public bool IsCompleted { get; set; } = false;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Range(0, 100)]
        public int Progress { get; set; } = 0; // Progress percentage

        // New fields for enhanced functionality
        public DateTime? DueDate { get; set; } // When the todo should be completed
        public DateTime? StartDate { get; set; } // When work actually started
        public DateTime? CompletedDate { get; set; } // When actually completed

        public PersonalTodoPriority Priority { get; set; } = PersonalTodoPriority.Medium;
        public PersonalTodoStatus Status { get; set; } = PersonalTodoStatus.Pending;

        // Alert and reminder fields
        public bool EnableReminders { get; set; } = true;
        public int? ReminderHoursBeforeDue { get; set; } = 24; // Default 24 hours
        public DateTime? LastReminderSent { get; set; }
        public bool EnableSmsReminders { get; set; } = false; // SMS reminders (optional)
        public bool EnablePushNotifications { get; set; } = true; // Push notifications
        public bool EnableEmailReminders { get; set; } = true; // Email reminders

        // Tags for organization
        [MaxLength(200)]
        public string? Tags { get; set; } // Comma-separated tags

        // Notes and comments
        [MaxLength(1000)]
        public string? Notes { get; set; }

        // Recurring todo support
        public bool IsRecurring { get; set; } = false;
        [MaxLength(50)]
        public string? RecurrencePattern { get; set; } // e.g., "daily", "weekly", "monthly"

        // Computed properties
        [NotMapped]
        public bool IsOverdue => DueDate.HasValue && DateTime.UtcNow > DueDate.Value && !IsCompleted;

        [NotMapped]
        public TimeSpan? TimeUntilDue => DueDate.HasValue ? DueDate.Value - DateTime.UtcNow : null;

        [NotMapped]
        public string? TimeUntilDueFormatted
        {
            get
            {
                if (!TimeUntilDue.HasValue) return null;
                var timeSpan = TimeUntilDue.Value;
                
                if (timeSpan.TotalDays >= 1)
                    return $"{(int)timeSpan.TotalDays} day(s)";
                else if (timeSpan.TotalHours >= 1)
                    return $"{(int)timeSpan.TotalHours} hour(s)";
                else if (timeSpan.TotalMinutes >= 1)
                    return $"{(int)timeSpan.TotalMinutes} minute(s)";
                else
                    return "Due now";
            }
        }

        [NotMapped]
        public bool NeedsReminder => EnableReminders && 
                                   DueDate.HasValue && 
                                   ReminderHoursBeforeDue.HasValue &&
                                   !IsCompleted &&
                                   (EnableEmailReminders || EnablePushNotifications || EnableSmsReminders) &&
                                   (!LastReminderSent.HasValue || 
                                    LastReminderSent.Value.AddHours(ReminderHoursBeforeDue.Value) <= DateTime.UtcNow);
    }
}