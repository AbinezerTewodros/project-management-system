using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.PersonalTodoDto
{
    /// <summary>
    /// DTO for updating an existing personal todo item.
    /// </summary>
    public class PersonalTodoUpdateDto
    {
        /// <summary>
        /// The task description.
        /// </summary>
        [MaxLength(500)]
        public string? Task { get; set; }

        /// <summary>
        /// Optional detailed description of the task.
        /// </summary>
        [MaxLength(2000)]
        public string? Description { get; set; }

        /// <summary>
        /// Whether the todo is completed.
        /// </summary>
        public bool? IsCompleted { get; set; }

        /// <summary>
        /// Progress percentage (0-100).
        /// </summary>
        [Range(0, 100)]
        public int? Progress { get; set; }

        /// <summary>
        /// When the todo should be completed.
        /// </summary>
        public DateTime? DueDate { get; set; }

        /// <summary>
        /// When work actually started.
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Priority level of the todo.
        /// </summary>
        public PersonalTodoPriority? Priority { get; set; }

        /// <summary>
        /// Current status of the todo.
        /// </summary>
        public PersonalTodoStatus? Status { get; set; }

        /// <summary>
        /// Whether to enable reminders for this todo.
        /// </summary>
        public bool? EnableReminders { get; set; }

        /// <summary>
        /// Hours before due date to send reminder.
        /// </summary>
        [Range(1, 168)] // 1 hour to 1 week
        public int? ReminderHoursBeforeDue { get; set; }

        /// <summary>
        /// Whether to enable email reminders.
        /// </summary>
        public bool? EnableEmailReminders { get; set; }

        /// <summary>
        /// Whether to enable push notifications.
        /// </summary>
        public bool? EnablePushNotifications { get; set; }

        /// <summary>
        /// Whether to enable SMS reminders.
        /// </summary>
        public bool? EnableSmsReminders { get; set; }

        /// <summary>
        /// Comma-separated tags for organization.
        /// </summary>
        [MaxLength(200)]
        public string? Tags { get; set; }

        /// <summary>
        /// Additional notes or comments.
        /// </summary>
        [MaxLength(1000)]
        public string? Notes { get; set; }

        /// <summary>
        /// Whether this is a recurring todo.
        /// </summary>
        public bool? IsRecurring { get; set; }

        /// <summary>
        /// Recurrence pattern (e.g., "daily", "weekly", "monthly").
        /// </summary>
        [MaxLength(50)]
        public string? RecurrencePattern { get; set; }
    }
}

