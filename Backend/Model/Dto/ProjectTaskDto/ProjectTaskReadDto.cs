using System;
using ProjectManagementSystem1.Model.Entities;
using TaskStatus = ProjectManagementSystem1.Model.Entities.TaskStatus;

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
        public DateTime? DueDate { get; set; }
        public TaskStatus Status { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }

        // Subtasks (hierarchy)
        public ICollection<ProjectTaskReadDto> SubTasks { get; set; } = new List<ProjectTaskReadDto>();
    }
}
