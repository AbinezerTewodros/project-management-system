using System;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto
{
    public class ProjectTaskReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ProjectAssignmentId { get; set; }
        public string? AssignedMemberId { get; set; }
        public int? ParentTaskId { get; set; }

        // Auto-calculated fields
        public int Depth { get; set; }
        public bool IsLeaf { get; set; }
        public double Progress { get; set; }

        // Manual fields
        public int Weight { get; set; }
        public TaskPriority Priority { get; set; }
        public double EstimatedHours { get; set; }
        public double? ActualHours { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public Entities.TaskStatus Status { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsProjectRoot { get; set; }
        // Subtasks (hierarchy)
        public bool? IsAutoCreateTodo { get; set; }
        public List<int> Dependencies { get; set; } = new List<int>();
        public ICollection<ProjectTaskReadDto> SubTasks { get; set; } = new List<ProjectTaskReadDto>();
        public ICollection<TodoItemReadDto> TodoItems { get; set; } = new List<TodoItemReadDto>();
    }
}
