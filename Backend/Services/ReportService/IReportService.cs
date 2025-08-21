using ProjectManagementSystem1.Model.Dto.Reports;

namespace ProjectManagementSystem1.Services.ReportService
{
    public interface IReportService
    {
        // Project Reports
        Task<ReportResponseDto<ProjectSummaryReportDto>> GenerateProjectSummaryReportAsync(ReportRequestDto request, string userId);
        
        // Task Reports
        Task<ReportResponseDto<TaskProgressReportDto>> GenerateTaskProgressReportAsync(ReportRequestDto request, string userId);
        
        // Team Performance Reports
        Task<ReportResponseDto<TeamPerformanceReportDto>> GenerateTeamPerformanceReportAsync(ReportRequestDto request, string userId);
        
        // Issue Reports
        Task<ReportResponseDto<IssueSummaryReportDto>> GenerateIssueSummaryReportAsync(ReportRequestDto request, string userId);
        
        // Generic Report Generation
        Task<ReportResponseDto<object>> GenerateReportAsync(ReportRequestDto request, string userId);
        
        // Report Export
        Task<byte[]> ExportReportAsync(ReportRequestDto request, string userId);
        
        // Report Templates and Metadata
        Task<List<ReportTemplateDto>> GetAvailableReportsAsync(string userId);
        Task<ReportMetadataDto> GetReportMetadataAsync(ReportType reportType, string userId);
        
        // Scheduled Reports (for future enhancement)
        Task<bool> ScheduleReportAsync(ScheduledReportDto scheduledReport, string userId);
        Task<List<ScheduledReportDto>> GetScheduledReportsAsync(string userId);
    }

    // Supporting DTOs
    public class ReportTemplateDto
    {
        public ReportType Type { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> RequiredParameters { get; set; } = new();
        public List<string> OptionalParameters { get; set; } = new();
        public List<ReportFormat> SupportedFormats { get; set; } = new();
        public bool RequiresManagerRole { get; set; } = false;
        public bool RequiresAdminRole { get; set; } = false;
    }

    public class ReportMetadataDto
    {
        public ReportType Type { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ReportFilterDto> AvailableFilters { get; set; } = new();
        public List<ReportColumnDto> AvailableColumns { get; set; } = new();
        public ReportPermissionDto Permissions { get; set; } = new();
    }

    public class ReportFilterDto
    {
        public string Field { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "date", "select", "multiselect", "text", "number"
        public List<string> Options { get; set; } = new();
        public bool IsRequired { get; set; } = false;
    }

    public class ReportColumnDto
    {
        public string Field { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public bool IsSortable { get; set; } = true;
        public bool IsFilterable { get; set; } = true;
    }

    public class ReportPermissionDto
    {
        public bool CanView { get; set; }
        public bool CanExport { get; set; }
        public bool CanSchedule { get; set; }
        public List<string> RestrictedDepartments { get; set; } = new();
        public List<string> RestrictedProjects { get; set; } = new();
    }

    public class ScheduledReportDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ReportType ReportType { get; set; }
        public ReportRequestDto ReportRequest { get; set; } = new();
        public string CronExpression { get; set; } = string.Empty; // For scheduling
        public List<string> Recipients { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public DateTime NextRun { get; set; }
        public DateTime? LastRun { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
