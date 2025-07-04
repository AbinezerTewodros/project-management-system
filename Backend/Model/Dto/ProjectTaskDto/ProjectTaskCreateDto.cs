using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto
{
    public class ProjectTaskCreateDto
    {
        [Required, MaxLength(250)]
        public string Title { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public int ProjectAssignmentId { get; set; }

        public string? AssignedMemberId { get; set; }

        public int? ParentTaskId { get; set; }

        [Range(1, 100)]
        public int weight { get; set; }

        public double EstimatedHours { get; set; }
        public DateTime? StartDate { get; set; }
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        //public int? ProjectGoalId { get; set; }
        public System.Threading.Tasks.TaskStatus Status { get; set; }
        public DateTime? DueDate { get; set; }
        public List<int> Dependencies { get; set; } = new List<int>(); // Add this line
<<<<<<< HEAD

        public List<int> Dependencies { get; set; } = new List<int>(); // Add this line
=======
>>>>>>> 890391528c11f4793f7d61f942815184bf328287

        // Optional advanced structure handling
        //public int Depth { get; set; } = 0;
        //public bool IsLeaf { get; set; } = true;
        public int? MilestoneId { get; set; }

        public bool IsAutoCreateTodo { get; set; } = true; // Default to true


    }
}
