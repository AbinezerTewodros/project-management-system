using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto;

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    public class IssueCreateDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [MaxLength(250, ErrorMessage = "Title cannot exceed 250 characters.")]
        public string Title { get; set; }

        public string Description { get; set; }

        // Optional: Can be set to default in service if not provided
        public IssueStatus? Status { get; set; }

        public IssuePriority? Priority { get; set; }

        // Assuming AssigneeId is always required for creation
        [Required(ErrorMessage = "Assignee ID is required.")]
        public string? ReporterId { get; set; }

        public string? AssigneeId { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }
        public int? IndependentTaskId { get; set; }
    }
}