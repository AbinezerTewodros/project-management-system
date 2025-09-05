using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.FileOperations;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.FileOperationsService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FileOperationsController : ControllerBase
    {
        private readonly IFileOperationsService _fileOperationsService;
        private readonly ILogger<FileOperationsController> _logger;

        public FileOperationsController(
            IFileOperationsService fileOperationsService,
            ILogger<FileOperationsController> logger)
        {
            _fileOperationsService = fileOperationsService;
            _logger = logger;
        }

        #region File Upload Operations

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile([FromBody] AttachmentUploadDto uploadDto, [FromQuery] string entityType, [FromQuery] string entityId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var context = new EntityContext(entityType, entityId);
                var jobId = await _fileOperationsService.UploadFileAsync(uploadDto, context, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File upload job queued successfully. Job ID: {jobId}. File: {uploadDto.File?.FileName}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file upload job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file upload job"));
            }
        }

        [HttpPost("upload/multiple")]
        public async Task<IActionResult> UploadMultipleFiles([FromBody] List<AttachmentUploadDto> uploadDtos, [FromQuery] string entityType, [FromQuery] string entityId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var context = new EntityContext(entityType, entityId);
                var jobId = await _fileOperationsService.UploadMultipleFilesAsync(uploadDtos, context, userId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Multiple files upload job queued successfully. Job ID: {jobId}. Files: {uploadDtos.Count}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue multiple files upload job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue multiple files upload job"));
            }
        }

        #endregion

        #region File Processing Operations

        [HttpPost("process")]
        public async Task<IActionResult> ProcessFile([FromBody] FileProcessingRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.ProcessFileAsync(request.AttachmentId, request.ProcessingType);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File processing job queued successfully. Job ID: {jobId}. Type: {request.ProcessingType}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file processing job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file processing job"));
            }
        }

        [HttpPost("preview")]
        public async Task<IActionResult> GenerateFilePreview([FromQuery] Guid attachmentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.GenerateFilePreviewAsync(attachmentId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File preview generation job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file preview generation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file preview generation job"));
            }
        }

        [HttpPost("thumbnail")]
        public async Task<IActionResult> GenerateThumbnail([FromQuery] Guid attachmentId, [FromQuery] int width = 200, [FromQuery] int height = 200)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.GenerateThumbnailAsync(attachmentId, width, height);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Thumbnail generation job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue thumbnail generation job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue thumbnail generation job"));
            }
        }

        #endregion

        #region File Conversion Operations

        [HttpPost("convert")]
        public async Task<IActionResult> ConvertFileFormat([FromBody] FileConversionRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.ConvertFileFormatAsync(request.AttachmentId, request.TargetFormat);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File format conversion job queued successfully. Job ID: {jobId}. Target: {request.TargetFormat}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file format conversion job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file format conversion job"));
            }
        }

        [HttpPost("compress")]
        public async Task<IActionResult> CompressFile([FromQuery] Guid attachmentId, [FromQuery] int compressionLevel = 6)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.CompressFileAsync(attachmentId, compressionLevel);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File compression job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file compression job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file compression job"));
            }
        }

        #endregion

        #region File Analysis Operations

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeFileContent([FromBody] FileAnalysisRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.AnalyzeFileContentAsync(request.AttachmentId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"File content analysis job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue file content analysis job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue file content analysis job"));
            }
        }

        [HttpPost("extract-text")]
        public async Task<IActionResult> ExtractTextFromFile([FromQuery] Guid attachmentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.ExtractTextFromFileAsync(attachmentId);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Text extraction job queued successfully. Job ID: {jobId}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue text extraction job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue text extraction job"));
            }
        }

        #endregion

        #region Bulk File Operations

        [HttpPost("bulk/process")]
        public async Task<IActionResult> BulkProcessFiles([FromBody] BulkFileOperationRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                var jobId = await _fileOperationsService.BulkProcessFilesAsync(request.AttachmentIds, request.OperationType);
                
                return Ok(ApiResponse<string>.CreateSuccess(jobId, 
                    $"Bulk file processing job queued successfully. Job ID: {jobId}. Files: {request.AttachmentIds.Count}"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue bulk file processing job");
                return StatusCode(500, ApiResponse<string>.CreateError("Failed to queue bulk file processing job"));
            }
        }

        #endregion

        #region Job Management

        [HttpGet("jobs/{jobId}/status")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            try
            {
                var status = await _fileOperationsService.GetFileJobStatusAsync(jobId);
                return Ok(ApiResponse<FileJobStatusDto>.CreateSuccess(status, "Job status retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job status for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<FileJobStatusDto>.CreateError("Failed to get job status"));
            }
        }

        [HttpGet("jobs/{jobId}/result")]
        public async Task<IActionResult> GetJobResult(string jobId)
        {
            try
            {
                var result = await _fileOperationsService.GetFileJobResultAsync(jobId);
                return Ok(ApiResponse<FileJobResultDto>.CreateSuccess(result, "Job result retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get job result for job {JobId}", jobId);
                return StatusCode(500, ApiResponse<FileJobResultDto>.CreateError("Failed to get job result"));
            }
        }

        [HttpDelete("jobs/{jobId}")]
        public async Task<IActionResult> CancelJob(string jobId)
        {
            try
            {
                var cancelled = await _fileOperationsService.CancelFileJobAsync(jobId);
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

                var jobs = await _fileOperationsService.GetUserFileJobsAsync(userId, pageNumber, pageSize);
                return Ok(ApiResponse<List<FileJobStatusDto>>.CreateSuccess(jobs, "User jobs retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user jobs");
                return StatusCode(500, ApiResponse<List<FileJobStatusDto>>.CreateError("Failed to get user jobs"));
            }
        }

        #endregion
    }
}
