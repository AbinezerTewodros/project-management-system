using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.TaskDependencyDto
{
    public class CreateTaskDependencyDto
    {
        [Required]
        public int PredecessorTaskId { get; set; }

        [Required]
        public int SuccessorTaskId { get; set; }

        [Required]
        public DependencyType DependencyType { get; set; } = DependencyType.FinishToStart;

        public int? LagDays { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }
    }

    public class UpdateTaskDependencyDto
    {
        [Required]
        public DependencyType DependencyType { get; set; }

        public int? LagDays { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }
    }

    public class TaskDependencyReadDto
    {
        public int Id { get; set; }
        public int PredecessorTaskId { get; set; }
        public int SuccessorTaskId { get; set; }
        public DependencyType DependencyType { get; set; }
        public int? LagDays { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserId { get; set; }

        // Navigation properties
        public string? PredecessorTaskTitle { get; set; }
        public string? SuccessorTaskTitle { get; set; }
        public string? CreatedByUserName { get; set; }
    }
}
