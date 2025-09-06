using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.PersonalTodoDto
{
    /// <summary>
    /// DTO for reading personal todo items with computed properties.
    /// </summary>
    public class PersonalTodoReadDto
    {
        /// <summary>
        /// Unique identifier for the todo.
        /// </summary>
        public int TodoId { get; set; }

        /// <summary>
        /// The task description.
        /// </summary>
        public string Task { get; set; } = string.Empty;

        /// <summary>
        /// Optional detailed description of the task.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Whether the todo is completed.
        /// </summary>
        public bool IsCompleted { get; set; }

        /// <summary>
        /// Progress percentage (0-100).
        /// </summary>
        public int Progress { get; set; }

        /// <summary>
        /// When the todo was created.
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When the todo was last updated.
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// When the todo should be completed.
        /// </summary>
        public DateTime? DueDate { get; set; }

        /// <summary>
        /// When work actually started.
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// When the todo was actually completed.
        /// </summary>
        public DateTime? CompletedDate { get; set; }

        /// <summary>
        /// Priority level of the todo.
        /// </summary>
        public PersonalTodoPriority Priority { get; set; }

        /// <summary>
        /// Current status of the todo.
        /// </summary>
        public PersonalTodoStatus Status { get; set; }

        /// <summary>
        /// Whether reminders are enabled for this todo.
        /// </summary>
        public bool EnableReminders { get; set; }

        /// <summary>
        /// Hours before due date to send reminder.
        /// </summary>
        public int? ReminderHoursBeforeDue { get; set; }

        /// <summary>
        /// When the last reminder was sent.
        /// </summary>
        public DateTime? LastReminderSent { get; set; }

        /// <summary>
        /// Whether email reminders are enabled.
        /// </summary>
        public bool EnableEmailReminders { get; set; }

        /// <summary>
        /// Whether push notifications are enabled.
        /// </summary>
        public bool EnablePushNotifications { get; set; }

        /// <summary>
        /// Whether SMS reminders are enabled.
        /// </summary>
        public bool EnableSmsReminders { get; set; }

        /// <summary>
        /// Comma-separated tags for organization.
        /// </summary>
        public string? Tags { get; set; }

        /// <summary>
        /// Additional notes or comments.
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Whether this is a recurring todo.
        /// </summary>
        public bool IsRecurring { get; set; }

        /// <summary>
        /// Recurrence pattern (e.g., "daily", "weekly", "monthly").
        /// </summary>
        public string? RecurrencePattern { get; set; }

        // Computed properties
        /// <summary>
        /// Whether the todo is overdue.
        /// </summary>
        public bool IsOverdue { get; set; }

        /// <summary>
        /// Time until due date in a human-readable format.
        /// </summary>
        public string? TimeUntilDueFormatted { get; set; }

        /// <summary>
        /// Whether a reminder is needed.
        /// </summary>
        public bool NeedsReminder { get; set; }

        /// <summary>
        /// Days until due (negative if overdue).
        /// </summary>
        public int? DaysUntilDue { get; set; }

        /// <summary>
        /// Hours until due (negative if overdue).
        /// </summary>
        public int? HoursUntilDue { get; set; }
    }
}

