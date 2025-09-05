using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Dto.FileOperations;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.AttachmentService;
using ProjectManagementSystem1.Services.FileStorageService;

namespace ProjectManagementSystem1.Services.FileOperationsService
{
    public class FileOperationsService : IFileOperationsService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<FileOperationsService> _logger;
        private readonly IAttachmentService _attachmentService;
        private readonly IFileStorageService _fileStorageService;
        private readonly IAttachmentPreviewService _previewService;
        private readonly IActivityLogService _activityLogService;

        public FileOperationsService(
            AppDbContext context,
            ILogger<FileOperationsService> logger,
            IAttachmentService attachmentService,
            IFileStorageService fileStorageService,
            IAttachmentPreviewService previewService,
            IActivityLogService activityLogService)
        {
            _context = context;
            _logger = logger;
            _attachmentService = attachmentService;
            _fileStorageService = fileStorageService;
            _previewService = previewService;
            _activityLogService = activityLogService;
        }

        #region File Upload Operations

        public async Task<string> UploadFileAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId)
        {
            var jobId = BackgroundJob.Enqueue(() => UploadFileInternalAsync(uploadDto, context, uploadedByUserId));
            _logger.LogInformation("File upload job queued with ID {JobId} for file {FileName}", jobId, uploadDto.File?.FileName);
            return jobId;
        }

        public async Task<string> UploadMultipleFilesAsync(List<AttachmentUploadDto> uploadDtos, EntityContext context, string uploadedByUserId)
        {
            var jobId = BackgroundJob.Enqueue(() => UploadMultipleFilesInternalAsync(uploadDtos, context, uploadedByUserId));
            _logger.LogInformation("Multiple files upload job queued with ID {JobId} for {Count} files", jobId, uploadDtos.Count);
            return jobId;
        }

        public async Task<string> UploadLargeFileAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId, int chunkSize = 1024 * 1024)
        {
            var jobId = BackgroundJob.Enqueue(() => UploadLargeFileInternalAsync(uploadDto, context, uploadedByUserId, chunkSize));
            _logger.LogInformation("Large file upload job queued with ID {JobId} for file {FileName}", jobId, uploadDto.File?.FileName);
            return jobId;
        }

        #endregion

        #region File Processing Operations

        public async Task<string> ProcessFileAsync(Guid attachmentId, string processingType)
        {
            var jobId = BackgroundJob.Enqueue(() => ProcessFileInternalAsync(attachmentId, processingType));
            _logger.LogInformation("File processing job queued with ID {JobId} for attachment {AttachmentId}, type: {ProcessingType}", jobId, attachmentId, processingType);
            return jobId;
        }

        public async Task<string> GenerateFilePreviewAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => GenerateFilePreviewInternalAsync(attachmentId));
            _logger.LogInformation("File preview generation job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> GenerateThumbnailAsync(Guid attachmentId, int width = 200, int height = 200)
        {
            var jobId = BackgroundJob.Enqueue(() => GenerateThumbnailInternalAsync(attachmentId, width, height));
            _logger.LogInformation("Thumbnail generation job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> ExtractFileMetadataAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => ExtractFileMetadataInternalAsync(attachmentId));
            _logger.LogInformation("File metadata extraction job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> ValidateFileAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => ValidateFileInternalAsync(attachmentId));
            _logger.LogInformation("File validation job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        #endregion

        #region File Conversion Operations

        public async Task<string> ConvertFileFormatAsync(Guid attachmentId, string targetFormat)
        {
            var jobId = BackgroundJob.Enqueue(() => ConvertFileFormatInternalAsync(attachmentId, targetFormat));
            _logger.LogInformation("File format conversion job queued with ID {JobId} for attachment {AttachmentId} to {TargetFormat}", jobId, attachmentId, targetFormat);
            return jobId;
        }

        public async Task<string> CompressFileAsync(Guid attachmentId, int compressionLevel = 6)
        {
            var jobId = BackgroundJob.Enqueue(() => CompressFileInternalAsync(attachmentId, compressionLevel));
            _logger.LogInformation("File compression job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> DecompressFileAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => DecompressFileInternalAsync(attachmentId));
            _logger.LogInformation("File decompression job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> ResizeImageAsync(Guid attachmentId, int width, int height, bool maintainAspectRatio = true)
        {
            var jobId = BackgroundJob.Enqueue(() => ResizeImageInternalAsync(attachmentId, width, height, maintainAspectRatio));
            _logger.LogInformation("Image resize job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        #endregion

        #region File Analysis Operations

        public async Task<string> AnalyzeFileContentAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => AnalyzeFileContentInternalAsync(attachmentId));
            _logger.LogInformation("File content analysis job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> ExtractTextFromFileAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => ExtractTextFromFileInternalAsync(attachmentId));
            _logger.LogInformation("Text extraction job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> ScanFileForVirusAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => ScanFileForVirusInternalAsync(attachmentId));
            _logger.LogInformation("Virus scan job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        public async Task<string> CalculateFileChecksumAsync(Guid attachmentId)
        {
            var jobId = BackgroundJob.Enqueue(() => CalculateFileChecksumInternalAsync(attachmentId));
            _logger.LogInformation("Checksum calculation job queued with ID {JobId} for attachment {AttachmentId}", jobId, attachmentId);
            return jobId;
        }

        #endregion

        #region File Maintenance Operations

        public async Task<string> CleanupOrphanedFilesAsync()
        {
            var jobId = BackgroundJob.Enqueue(() => CleanupOrphanedFilesInternalAsync());
            _logger.LogInformation("Orphaned files cleanup job queued with ID {JobId}", jobId);
            return jobId;
        }

        public async Task<string> OptimizeFileStorageAsync()
        {
            var jobId = BackgroundJob.Enqueue(() => OptimizeFileStorageInternalAsync());
            _logger.LogInformation("File storage optimization job queued with ID {JobId}", jobId);
            return jobId;
        }

        public async Task<string> RebuildFileIndexAsync()
        {
            var jobId = BackgroundJob.Enqueue(() => RebuildFileIndexInternalAsync());
            _logger.LogInformation("File index rebuild job queued with ID {JobId}", jobId);
            return jobId;
        }

        public async Task<string> ArchiveOldFilesAsync(DateTime cutoffDate)
        {
            var jobId = BackgroundJob.Enqueue(() => ArchiveOldFilesInternalAsync(cutoffDate));
            _logger.LogInformation("Old files archive job queued with ID {JobId} for files older than {CutoffDate}", jobId, cutoffDate);
            return jobId;
        }

        #endregion

        #region Bulk File Operations

        public async Task<string> BulkProcessFilesAsync(List<Guid> attachmentIds, string operationType)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkProcessFilesInternalAsync(attachmentIds, operationType));
            _logger.LogInformation("Bulk file processing job queued with ID {JobId} for {Count} files, operation: {OperationType}", jobId, attachmentIds.Count, operationType);
            return jobId;
        }

        public async Task<string> BulkConvertFilesAsync(List<Guid> attachmentIds, string targetFormat)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkConvertFilesInternalAsync(attachmentIds, targetFormat));
            _logger.LogInformation("Bulk file conversion job queued with ID {JobId} for {Count} files to {TargetFormat}", jobId, attachmentIds.Count, targetFormat);
            return jobId;
        }

        public async Task<string> BulkGeneratePreviewsAsync(List<Guid> attachmentIds)
        {
            var jobId = BackgroundJob.Enqueue(() => BulkGeneratePreviewsInternalAsync(attachmentIds));
            _logger.LogInformation("Bulk preview generation job queued with ID {JobId} for {Count} files", jobId, attachmentIds.Count);
            return jobId;
        }

        #endregion

        #region File Transfer Operations

        public async Task<string> MoveFileAsync(Guid attachmentId, string newLocation)
        {
            var jobId = BackgroundJob.Enqueue(() => MoveFileInternalAsync(attachmentId, newLocation));
            _logger.LogInformation("File move job queued with ID {JobId} for attachment {AttachmentId} to {NewLocation}", jobId, attachmentId, newLocation);
            return jobId;
        }

        public async Task<string> CopyFileAsync(Guid attachmentId, string destination)
        {
            var jobId = BackgroundJob.Enqueue(() => CopyFileInternalAsync(attachmentId, destination));
            _logger.LogInformation("File copy job queued with ID {JobId} for attachment {AttachmentId} to {Destination}", jobId, attachmentId, destination);
            return jobId;
        }

        public async Task<string> SyncFilesAsync(string sourcePath, string destinationPath)
        {
            var jobId = BackgroundJob.Enqueue(() => SyncFilesInternalAsync(sourcePath, destinationPath));
            _logger.LogInformation("File sync job queued with ID {JobId} from {SourcePath} to {DestinationPath}", jobId, sourcePath, destinationPath);
            return jobId;
        }

        #endregion

        #region Job Status and Results

        public async Task<FileJobStatusDto> GetFileJobStatusAsync(string jobId)
        {
            // This would typically query a database table that tracks job status
            // For now, we'll return a placeholder implementation
            return new FileJobStatusDto
            {
                JobId = jobId,
                Status = "Processing",
                OperationType = "Unknown",
                CreatedAt = DateTime.UtcNow,
                ProgressPercentage = 0
            };
        }

        public async Task<FileJobResultDto> GetFileJobResultAsync(string jobId)
        {
            // This would typically retrieve results from a database table
            // For now, we'll return a placeholder implementation
            return new FileJobResultDto
            {
                JobId = jobId,
                Success = true,
                OperationType = "Unknown",
                CompletedAt = DateTime.UtcNow,
                ProcessingTime = TimeSpan.Zero
            };
        }

        public async Task<bool> CancelFileJobAsync(string jobId)
        {
            try
            {
                var deleted = BackgroundJob.Delete(jobId);
                if (deleted)
                {
                    _logger.LogInformation("File job {JobId} cancelled successfully", jobId);
                }
                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel file job {JobId}", jobId);
                return false;
            }
        }

        public async Task<List<FileJobStatusDto>> GetUserFileJobsAsync(string userId, int pageNumber = 1, int pageSize = 20)
        {
            // This would typically query a database table for user's file jobs
            // For now, we'll return a placeholder implementation
            return new List<FileJobStatusDto>();
        }

        #endregion

        #region Internal Implementation Methods

        // These methods will be implemented with the actual business logic
        // They are marked as public so Hangfire can call them

        [AutomaticRetry(Attempts = 3)]
        public async Task UploadFileInternalAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File upload completed for {FileName}", uploadDto.File?.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file {FileName}", uploadDto.File?.FileName);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task UploadMultipleFilesInternalAsync(List<AttachmentUploadDto> uploadDtos, EntityContext context, string uploadedByUserId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Multiple files upload completed for {Count} files", uploadDtos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload multiple files");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task UploadLargeFileInternalAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId, int chunkSize)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Large file upload completed for {FileName}", uploadDto.File?.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload large file {FileName}", uploadDto.File?.FileName);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ProcessFileInternalAsync(Guid attachmentId, string processingType)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File processing completed for attachment {AttachmentId}, type: {ProcessingType}", attachmentId, processingType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process file {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task GenerateFilePreviewInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File preview generated for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate preview for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task GenerateThumbnailInternalAsync(Guid attachmentId, int width, int height)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Thumbnail generated for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate thumbnail for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ExtractFileMetadataInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Metadata extracted for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract metadata for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ValidateFileInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File validated for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ConvertFileFormatInternalAsync(Guid attachmentId, string targetFormat)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File converted to {TargetFormat} for attachment {AttachmentId}", targetFormat, attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to convert file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task CompressFileInternalAsync(Guid attachmentId, int compressionLevel)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File compressed for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to compress file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task DecompressFileInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File decompressed for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to decompress file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ResizeImageInternalAsync(Guid attachmentId, int width, int height, bool maintainAspectRatio)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Image resized for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resize image for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task AnalyzeFileContentInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File content analyzed for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to analyze file content for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ExtractTextFromFileInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Text extracted for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract text for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ScanFileForVirusInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Virus scan completed for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to scan file for virus for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task CalculateFileChecksumInternalAsync(Guid attachmentId)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Checksum calculated for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to calculate checksum for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task CleanupOrphanedFilesInternalAsync()
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Orphaned files cleanup completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup orphaned files");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task OptimizeFileStorageInternalAsync()
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File storage optimization completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to optimize file storage");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task RebuildFileIndexInternalAsync()
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File index rebuild completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to rebuild file index");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task ArchiveOldFilesInternalAsync(DateTime cutoffDate)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Old files archive completed for files older than {CutoffDate}", cutoffDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to archive old files");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task BulkProcessFilesInternalAsync(List<Guid> attachmentIds, string operationType)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk file processing completed for {Count} files", attachmentIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk process files");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task BulkConvertFilesInternalAsync(List<Guid> attachmentIds, string targetFormat)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk file conversion completed for {Count} files", attachmentIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk convert files");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task BulkGeneratePreviewsInternalAsync(List<Guid> attachmentIds)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("Bulk preview generation completed for {Count} files", attachmentIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk generate previews");
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task MoveFileInternalAsync(Guid attachmentId, string newLocation)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File moved for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to move file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task CopyFileInternalAsync(Guid attachmentId, string destination)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File copied for attachment {AttachmentId}", attachmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to copy file for attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        [AutomaticRetry(Attempts = 2)]
        public async Task SyncFilesInternalAsync(string sourcePath, string destinationPath)
        {
            try
            {
                // Implementation will go here
                await Task.Delay(100); // Placeholder
                _logger.LogInformation("File sync completed from {SourcePath} to {DestinationPath}", sourcePath, destinationPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync files");
                throw;
            }
        }

        #endregion
    }
}
