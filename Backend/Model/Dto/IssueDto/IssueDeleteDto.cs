using ProjectManagementSystem1.Model.Entities;
using System;
using ProjectManagementSystem1.Model.Dto; // If you want to include enum types for clarity

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    public class IssueDeletedDto
    {
        public int Id { get; set; } // The ID of the deleted issue
        public string Message { get; set; } // A confirmation message
        public DateTime DeletionTimestamp { get; set; } = DateTime.UtcNow; // When it was deleted
        public string Title { get; set; } // Optionally, the title of the deleted issue
        public IssueStatus? LastKnownStatus { get; set; } // Optionally, its status before deletion
    }
}