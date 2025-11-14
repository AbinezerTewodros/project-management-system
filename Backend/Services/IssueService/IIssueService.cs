using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Model.Dto.Issue;// Ensure this is included for enums if used in DTOs/parameters

namespace ProjectManagementSystem1.Services.IssueService
{
    public interface IIssueService
    {
        // CRUD Operations
        Task<IssueDto> CreateIssueAsync(IssueCreateDto issueCreateDto);
        Task<IssueDto> GetIssueByIdAsync(int issueId);
        Task<IEnumerable<IssueDto>> GetAllIssuesAsync();
        Task<IssueDto> UpdateIssueAsync(int issueId, IssueUpdateDto issueUpdateDto);
        Task<IssueDeletedDto> DeleteIssueAsync(int issueId); // For DELETE /issues/{issueId}

        // Specific Endpoints
        Task<IEnumerable<IssueDto>> SearchIssuesAsync(IssueSearchDto searchDto); // For GET /issues/search
        Task<IEnumerable<IssueReportDto>> GetIssueReportsAsync(); // For GET /issues/reports
    }
}