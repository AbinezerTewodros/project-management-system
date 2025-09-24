using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    public class IssueUpdateDto
    {
        [MaxLength(250, ErrorMessage = "Title cannot exceed 250 characters.")]
        public string Title { get; set; }

        public string Description { get; set; }

        public IssueStatus? Status { get; set; }

        public IssuePriority? Priority { get; set; }
        public string? ReporterId { get; set; }

        public string? AssigneeId { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }

    }
}