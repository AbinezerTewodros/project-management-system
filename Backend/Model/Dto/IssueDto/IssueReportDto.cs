using ProjectManagementSystem1.Model.Entities; // To reference IssueStatus and IssuePriority enums
using ProjectManagementSystem1.Model.Dto.Issue;

namespace ProjectManagementSystem1.Model.Dto.Issue
{
    public class IssueReportDto
    {
        public IssueStatus Status { get; set; }
        public int Count { get; set; }
        public IssuePriority? Priority { get; set; } // Nullable, as not all reports might group by priority
    }
}