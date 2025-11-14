using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.DataProcessing;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.DataProcessingService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DataProcessingController : ControllerBase
    {
        private readonly IDataProcessingService _dataProcessingService;
        private readonly ILogger<DataProcessingController> _logger;

        public DataProcessingController(
            IDataProcessingService dataProcessingService,
            ILogger<DataProcessingController> logger)
        {
            _dataProcessingService = dataProcessingService;
            _logger = logger;
        }

        #region Report Generation Operations

        [HttpPost("reports/generate")]
        public async Task<IActionResult> GenerateReport([FromBody] ReportGenerationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GenerateReportAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Report generation job queued successfully. Job ID: {jobId}. Type: {request.ReportType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue report generation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue report generation job"));
            }
        }

        [HttpPost("reports/schedule")]
        public async Task<IActionResult> ScheduleReport([FromBody] ReportGenerationRequestDto request, [FromQuery] string schedule)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GenerateScheduledReportAsync(request.ReportType, schedule, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Scheduled report job created successfully. Job ID: {jobId}. Type: {request.ReportType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create scheduled report job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to create scheduled report job"));
            }
        }

        [HttpDelete("reports/schedule/{reportId}")]
        public async Task<IActionResult> CancelScheduledReport(string reportId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var result = await _dataProcessingService.CancelScheduledReportAsync(reportId, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(result, "Scheduled report cancelled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel scheduled report {ReportId}", reportId);
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to cancel scheduled report"));
            }
        }

        #endregion

        #region Data Export Operations

        [HttpPost("export")]
        public async Task<IActionResult> ExportData([FromBody] DataExportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ExportDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data export job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data export job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data export job"));
            }
        }

        [HttpPost("export/background")]
        public async Task<IActionResult> ExportDataInBackground([FromBody] DataExportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ExportDataInBackgroundAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Background data export job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue background data export job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue background data export job"));
            }
        }

        [HttpDelete("export/{exportId}")]
        public async Task<IActionResult> CancelDataExport(string exportId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var result = await _dataProcessingService.CancelDataExportAsync(exportId, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(result, "Data export cancelled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel data export {ExportId}", exportId);
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to cancel data export"));
            }
        }

        #endregion

        #region Data Import Operations

        [HttpPost("import")]
        public async Task<IActionResult> ImportData([FromBody] DataImportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ImportDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data import job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data import job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data import job"));
            }
        }

        [HttpPost("import/validate")]
        public async Task<IActionResult> ValidateImportData([FromBody] DataImportRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ValidateImportDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Import validation job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue import validation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue import validation job"));
            }
        }

        [HttpDelete("import/{importId}")]
        public async Task<IActionResult> CancelDataImport(string importId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var result = await _dataProcessingService.CancelDataImportAsync(importId, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(result, "Data import cancelled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel data import {ImportId}", importId);
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to cancel data import"));
            }
        }

        #endregion

        #region Data Aggregation Operations

        [HttpPost("aggregate")]
        public async Task<IActionResult> AggregateData([FromBody] DataAggregationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.AggregateDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data aggregation job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data aggregation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data aggregation job"));
            }
        }

        [HttpPost("aggregate/trends")]
        public async Task<IActionResult> GenerateTrendAnalysis([FromBody] DataAggregationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GenerateTrendAnalysisAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Trend analysis job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue trend analysis job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue trend analysis job"));
            }
        }

        [HttpPost("aggregate/performance/{entityType}")]
        public async Task<IActionResult> GeneratePerformanceMetrics(string entityType)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GeneratePerformanceMetricsAsync(entityType, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Performance metrics job queued successfully. Job ID: {jobId}. Entity: {entityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue performance metrics job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue performance metrics job"));
            }
        }

        #endregion

        #region Data Validation Operations

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateData([FromBody] DataValidationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ValidateDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data validation job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data validation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data validation job"));
            }
        }

        [HttpPost("validate/fix")]
        public async Task<IActionResult> FixDataIssues([FromBody] DataValidationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.FixDataIssuesAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data fix job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data fix job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data fix job"));
            }
        }

        [HttpPost("validate/quality-report/{entityType}")]
        public async Task<IActionResult> GenerateDataQualityReport(string entityType)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GenerateDataQualityReportAsync(entityType, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data quality report job queued successfully. Job ID: {jobId}. Entity: {entityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data quality report job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data quality report job"));
            }
        }

        #endregion

        #region Data Cleanup Operations

        [HttpPost("cleanup")]
        public async Task<IActionResult> CleanupData([FromBody] DataCleanupRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.CleanupDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data cleanup job queued successfully. Job ID: {jobId}. Type: {request.CleanupType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data cleanup job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data cleanup job"));
            }
        }

        [HttpPost("cleanup/archive/{entityType}")]
        public async Task<IActionResult> ArchiveOldData(string entityType, [FromQuery] DateTime cutoffDate)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ArchiveOldDataAsync(entityType, cutoffDate, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data archive job queued successfully. Job ID: {jobId}. Entity: {entityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data archive job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data archive job"));
            }
        }

        [HttpPost("cleanup/duplicates/{entityType}")]
        public async Task<IActionResult> RemoveDuplicateRecords(string entityType)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.RemoveDuplicateRecordsAsync(entityType, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Duplicate removal job queued successfully. Job ID: {jobId}. Entity: {entityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue duplicate removal job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue duplicate removal job"));
            }
        }

        #endregion

        #region Scheduled Analytics Operations

        [HttpPost("analytics/schedule")]
        public async Task<IActionResult> ScheduleAnalytics([FromBody] ScheduledAnalyticsRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.ScheduleAnalyticsAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Analytics scheduling job created successfully. Job ID: {jobId}. Type: {request.AnalyticsType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create scheduled analytics job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to create scheduled analytics job"));
            }
        }

        [HttpPost("analytics/run-now")]
        public async Task<IActionResult> RunAnalyticsNow([FromBody] ScheduledAnalyticsRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.RunAnalyticsNowAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Analytics job queued successfully. Job ID: {jobId}. Type: {request.AnalyticsType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue analytics job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue analytics job"));
            }
        }

        [HttpDelete("analytics/schedule/{analyticsId}")]
        public async Task<IActionResult> CancelScheduledAnalytics(string analyticsId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var result = await _dataProcessingService.CancelScheduledAnalyticsAsync(analyticsId, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(result, "Scheduled analytics cancelled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel scheduled analytics {AnalyticsId}", analyticsId);
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to cancel scheduled analytics"));
            }
        }

        #endregion

        #region Bulk Data Operations

        [HttpPost("bulk/update")]
        public async Task<IActionResult> BulkUpdateData([FromBody] BulkDataOperationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.BulkUpdateDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk update job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk update job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk update job"));
            }
        }

        [HttpPost("bulk/delete")]
        public async Task<IActionResult> BulkDeleteData([FromBody] BulkDataOperationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.BulkDeleteDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk delete job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk delete job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk delete job"));
            }
        }

        [HttpPost("bulk/archive")]
        public async Task<IActionResult> BulkArchiveData([FromBody] BulkDataOperationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.BulkArchiveDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk archive job queued successfully. Job ID: {jobId}. Entity: {request.EntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk archive job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk archive job"));
            }
        }

        #endregion

        #region Data Sync Operations

        [HttpPost("sync")]
        public async Task<IActionResult> SyncData([FromBody] DataSyncRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.SyncDataAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data sync job queued successfully. Job ID: {jobId}. Source: {request.SourceEntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue data sync job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue data sync job"));
            }
        }

        [HttpPost("sync/incremental")]
        public async Task<IActionResult> SyncDataIncremental([FromBody] DataSyncRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.SyncDataIncrementalAsync(request, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Incremental sync job queued successfully. Job ID: {jobId}. Source: {request.SourceEntityType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue incremental sync job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue incremental sync job"));
            }
        }

        [HttpDelete("sync/{syncId}")]
        public async Task<IActionResult> CancelDataSync(string syncId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var result = await _dataProcessingService.CancelDataSyncAsync(syncId, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(result, "Data sync cancelled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel data sync {SyncId}", syncId);
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to cancel data sync"));
            }
        }

        #endregion

        #region Job Management

        [HttpGet("jobs/{jobId}/status")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            try
            {
                var status = await _dataProcessingService.GetDataProcessingJobStatusAsync(jobId);
                return Ok(ApiResponse<DataProcessingJobStatusDto>.CreateSuccess(status, "Job status retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job status for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<DataProcessingJobStatusDto>.CreateError("Failed to get job status"));
            }
        }

        [HttpGet("jobs/{jobId}/result")]
        public async Task<IActionResult> GetJobResult(string jobId)
        {
            try
            {
                var result = await _dataProcessingService.GetDataProcessingJobResultAsync(jobId);
                return Ok(ApiResponse<DataProcessingJobResultDto>.CreateSuccess(result, "Job result retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job result for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<DataProcessingJobResultDto>.CreateError("Failed to get job result"));
            }
        }

        [HttpDelete("jobs/{jobId}")]
        public async Task<IActionResult> CancelJob(string jobId)
        {
            try
            {
                var cancelled = await _dataProcessingService.CancelDataProcessingJobAsync(jobId);
                if (cancelled)
                {
                    return Ok(ApiResponse<bool>.CreateSuccess(true, $"Job {jobId} cancelled successfully"));
                }
                else
                {
                    return BadRequest(ApiResponse<bool>.CreateError($"Failed to cancel job {jobId}"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel job {JobId}", jobId);
                return StatusCode(500, ApiResponse<bool>.CreateError("Failed to cancel job"));
            }
        }

        [HttpGet("jobs/user")]
        public async Task<IActionResult> GetUserJobs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobs = await _dataProcessingService.GetUserDataProcessingJobsAsync(userId, pageNumber, pageSize);
                return Ok(ApiResponse<List<DataProcessingJobStatusDto>>.CreateSuccess(jobs, "User jobs retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user jobs");
                return StatusCode(500, ApiResponse<List<DataProcessingJobStatusDto>>.CreateError("Failed to get user jobs"));
            }
        }

        [HttpGet("jobs/type/{operationType}")]
        public async Task<IActionResult> GetJobsByType(string operationType, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var jobs = await _dataProcessingService.GetJobsByTypeAsync(operationType, pageNumber, pageSize);
                return Ok(ApiResponse<List<DataProcessingJobStatusDto>>.CreateSuccess(jobs, $"Jobs for type {operationType} retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get jobs for type {OperationType}", operationType);
                return StatusCode(500, ApiResponse<List<DataProcessingJobStatusDto>>.CreateError("Failed to get jobs by type"));
            }
        }

        #endregion

        #region Utility Operations

        [HttpPost("statistics")]
        public async Task<IActionResult> GetDataProcessingStatistics()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.GetDataProcessingStatisticsAsync(userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Statistics generation job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue statistics generation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue statistics generation job"));
            }
        }

        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeDataProcessing()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.OptimizeDataProcessingAsync(userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Data processing optimization job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue optimization job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue optimization job"));
            }
        }

        [HttpPost("backup-config")]
        public async Task<IActionResult> BackupDataProcessingConfiguration()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _dataProcessingService.BackupDataProcessingConfigurationAsync(userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Configuration backup job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue configuration backup job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue configuration backup job"));
            }
        }

        #endregion
    }
}
