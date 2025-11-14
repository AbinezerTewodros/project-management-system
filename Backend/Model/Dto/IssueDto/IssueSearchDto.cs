using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.IssueService;
using ProjectManagementSystem1.Model.Dto;

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    public class IssueSearchDto
    {
        public string Title { get; set; }
        public IssueStatus? Status { get; set; }
        public IssuePriority? Priority { get; set; }
        public string? AssigneeId { get; set; }
        public string? ReporterId { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }

        public string Keywords { get; set; } // For full-text search in description/title
    }
}