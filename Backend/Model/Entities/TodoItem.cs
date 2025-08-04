using Microsoft.VisualBasic;
using ProjectManagementSystem1.Model.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum TodoItemStatus { Pending, Accepted, Rejected, InProgress, WaitingForReview, Completed, Approved, Reopened }

    public class TodoItem : IRemindable
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectTaskId { get; set; }

        [ForeignKey("ProjectTaskId")]
        public ProjectTask ProjectTask { get; set; }

        [Required]
        public string? AssigneeId { get; set; }

        public string AssignedBy { get; set; } // FK to ApplicationUser
        [ForeignKey("AssignedBy")]
        public ApplicationUser AssigningTeamLeader { get; set; }


        [Required, MaxLength(250)]
        public string Title { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required, Range(0, 100)]
        public int Weight { get; set; }

        [Required, Range(0, 100)]
        public double Progress { get; set; } = 0;

        // Add any other properties that might be relevant for a todo item
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public DateTime? AcceptedDate { get; set; }
        public DateTime? StartDate { get; set; }

        public string? ReasonForLateCompletion { get; set; }
        public string? DetailsForLateCompletion { get; set; }
        public string? CompletionDetails { get; set; }
        public DateTime? DueDate { get; set; }
        public string? RejectionReason { get; set; }

        public int? IndependentTaskId { get; set; }
        [ForeignKey("IndependentTaskId")]
        public IndependentTask IndependentTask { get; set; }

        public TodoItemStatus Status { get; set; } = TodoItemStatus.Pending;
        string IRemindable.RecipientUserId => ProjectTask?.AssignedMemberId;
        string IRemindable.ReminderSubjectTemplate => "Reminder: Todo Item '{Title}' Due Soon";
        string IRemindable.ReminderMessageTemplate => "This is a reminder that the todo item '{Title}' is due on '{DueDate:yyyy-MM-dd}'. Please ensure it is completed on time.";
        string IRemindable.EntityType => "TodoItem";
        int IRemindable.Id => Id; // Explicit implementation for clarity
        //DateTime? IRemindable.DueDate { get; set; } // Explicit implementation for clarity
        string IRemindable.Title => Title; // Explicit implementation for clarity
    }
}
