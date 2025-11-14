using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Validation;

namespace ProjectManagementSystem1.Model.Dto
{
    public class ProjectTaskCreateDto
    {
        [Required(ErrorMessage = "Task title is required")]
        [StringLength(250, MinimumLength = 3, ErrorMessage = "Task title must be between 3 and 250 characters")]
        public string Title { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }
        public int ProjectId { get; set; }
        // [Required(ErrorMessage = "Project assignment ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Project assignment ID must be a positive number")]
        public int? ProjectAssignmentId { get; set; }

 
        [StringLength(450, ErrorMessage = "Assigned member ID cannot exceed 450 characters")]
        public string? AssignedMemberId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Parent task ID must be a positive number")]
        public int? ParentTaskId { get; set; }

        [Required(ErrorMessage = "Weight is required")]
        [Range(1, 100, ErrorMessage = "Weight must be between 1 and 100")]
        public int Weight { get; set; }

        [Range(0, 1000, ErrorMessage = "Estimated hours must be between 0 and 1000")]
        public double EstimatedHours { get; set; }

        [FutureDate(ErrorMessage = "Start date must be in the future")]
        public DateTime? StartDate { get; set; }

        [Required(ErrorMessage = "Priority is required")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Required(ErrorMessage = "Status is required")]
        public ProjectManagementSystem1.Model.Entities.TaskStatus Status { get; set; }

        [FutureDate(ErrorMessage = "Due date must be in the future")]
        public DateTime? DueDate { get; set; }

        public List<int> Dependencies { get; set; } = new List<int>();

        [Range(1, int.MaxValue, ErrorMessage = "Milestone ID must be a positive number")]
        public int? MilestoneId { get; set; }
        public bool InheritMilestoneTeam { get; set; } = false;
        public bool IsAutoCreateTodo { get; set; } = true;
    }
}
