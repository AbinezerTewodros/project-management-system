using System;
using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto
{
    public class ProjectTaskUpdateDto
    {

        [MaxLength(250)]
        public string Title { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        public int? ParentTaskId { get; set; }

        public string? AssignedMemberId { get; set; }

        [Range(1, 100)]
        public int? Weight { get; set; }

        public double? EstimatedHours { get; set; }

        public double? ActualHours { get; set; }

        //[Range(0, 100)]
        public double? Progress { get; set; }

        public DateTime? DueDate { get; set; }

        public TaskPriority? Priority { get; set; }
        //public int? ProjectGoalId { get; set; }
        public System.Threading.Tasks.TaskStatus? Status { get; set; }

        //[Required]
        //public TaskStatus? Status { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        //public string? UpdatedBy { get; set; }
        public DateTime? StartDate { get; set; }
        public List<int> Dependencies { get; set; } = new List<int>(); // Add this line
        public bool IsAutoCreateTodo { get; set; } = true; // Default to true


    }
}
