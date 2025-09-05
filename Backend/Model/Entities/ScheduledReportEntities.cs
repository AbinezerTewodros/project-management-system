using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Dto.ReportDto;

namespace ProjectManagementSystem1.Model.Entities
{
    public class ScheduledReportEntity
    {
        public int Id { get; set; }
        public string JobId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public ScheduleType ScheduleType { get; set; }
        public string CronExpression { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
        public ReportFormat ExportFormat { get; set; }
        public string Recipients { get; set; } = string.Empty; // JSON array of email addresses
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class ScheduledReportExecutionEntity
    {
        public int Id { get; set; }
        public string ExecutionId { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public ReportFormat ExportFormat { get; set; }
        public DateTime ExecutedAt { get; set; }
        public string Status { get; set; } = string.Empty; // Completed, Failed, InProgress
        public long FileSize { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
    }
}
