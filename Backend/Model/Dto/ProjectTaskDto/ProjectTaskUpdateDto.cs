using System;
using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Validation;

namespace ProjectManagementSystem1.Model.Dto
{
    public class ProjectTaskUpdateDto
    {
        [StringLength(250, MinimumLength = 3, ErrorMessage = "Task title must be between 3 and 250 characters")]
        public string Title { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Parent task ID must be a positive number")]
        public int? ParentTaskId { get; set; }

        [StringLength(450, ErrorMessage = "Assigned member ID cannot exceed 450 characters")]
        public string? AssignedMemberId { get; set; }

        [Range(1, 100, ErrorMessage = "Weight must be between 1 and 100")]
        public int? Weight { get; set; }

        [Range(0, 1000, ErrorMessage = "Estimated hours must be between 0 and 1000")]
        public double? EstimatedHours { get; set; }

        [Range(0, 1000, ErrorMessage = "Actual hours must be between 0 and 1000")]
        public double? ActualHours { get; set; }

        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
        public double? Progress { get; set; }

        [FutureDate(ErrorMessage = "Due date must be in the future")]
        public DateTime? DueDate { get; set; }

        public TaskPriority? Priority { get; set; }

        public ProjectManagementSystem1.Model.Entities.TaskStatus? Status { get; set; }

        [StringLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters")]
        public string? RejectionReason { get; set; }

        [FutureDate(ErrorMessage = "Start date must be in the future")]
        public DateTime? StartDate { get; set; }

        public List<int> Dependencies { get; set; } = new List<int>();

        public bool IsAutoCreateTodo { get; set; } = true;
    }
}
