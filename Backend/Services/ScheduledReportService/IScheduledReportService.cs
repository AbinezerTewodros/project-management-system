using ProjectManagementSystem1.Model.Dto.ReportDto;

namespace ProjectManagementSystem1.Services.ScheduledReportService
{
    public interface IScheduledReportService
    {
        Task<string> ScheduleReportAsync(ScheduledReportDto scheduledReport, string userId);
        Task<List<ScheduledReportDto>> GetScheduledReportsAsync(string userId);
        Task<bool> CancelScheduledReportAsync(string jobId, string userId);
        Task<bool> UpdateScheduledReportAsync(string jobId, ScheduledReportDto updatedReport, string userId);
        Task<List<ScheduledReportExecutionDto>> GetReportExecutionHistoryAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null);
        Task<byte[]> GetReportExecutionResultAsync(string executionId, string userId);
    }
}
