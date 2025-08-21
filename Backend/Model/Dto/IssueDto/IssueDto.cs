using ProjectManagementSystem1.Model.Entities;
using System;
using ProjectManagementSystem1.Model.Dto;

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    // This DTO represents the data returned by GET endpoints
    public class IssueDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public IssueStatus Status { get; set; }
        public IssuePriority Priority { get; set; }
        public IssueType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? ReporterId { get; set; }
        public string ReporterUsername { get; set; } // Include reporter info
        public string? AssigneeId { get; set; }
        public string AssigneeUsername { get; set; } // Include assignee info
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; } // From Project.Name

        public int? ProjectTaskId { get; set; }
        public string? ProjectTaskTitle { get; set; } // From ProjectTask.Title

        public int? IndependentTaskId { get; set; }
        public string? IndependentTaskTitle { get; set; } // From IndependentTask.Title
    }
}