using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Dto.FileOperations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.FileOperationsService
{
    public interface IFileOperationsService
    {
        // File Upload Operations
        Task<string> UploadFileAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId);
        Task<string> UploadMultipleFilesAsync(List<AttachmentUploadDto> uploadDtos, EntityContext context, string uploadedByUserId);
        Task<string> UploadLargeFileAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId, int chunkSize = 1024 * 1024);

        // File Processing Operations
        Task<string> ProcessFileAsync(Guid attachmentId, string processingType);
        Task<string> GenerateFilePreviewAsync(Guid attachmentId);
        Task<string> GenerateThumbnailAsync(Guid attachmentId, int width = 200, int height = 200);
        Task<string> ExtractFileMetadataAsync(Guid attachmentId);
        Task<string> ValidateFileAsync(Guid attachmentId);

        // File Conversion Operations
        Task<string> ConvertFileFormatAsync(Guid attachmentId, string targetFormat);
        Task<string> CompressFileAsync(Guid attachmentId, int compressionLevel = 6);
        Task<string> DecompressFileAsync(Guid attachmentId);
        Task<string> ResizeImageAsync(Guid attachmentId, int width, int height, bool maintainAspectRatio = true);

        // File Analysis Operations
        Task<string> AnalyzeFileContentAsync(Guid attachmentId);
        Task<string> ExtractTextFromFileAsync(Guid attachmentId);
        Task<string> ScanFileForVirusAsync(Guid attachmentId);
        Task<string> CalculateFileChecksumAsync(Guid attachmentId);

        // File Maintenance Operations
        Task<string> CleanupOrphanedFilesAsync();
        Task<string> OptimizeFileStorageAsync();
        Task<string> RebuildFileIndexAsync();
        Task<string> ArchiveOldFilesAsync(DateTime cutoffDate);

        // Bulk File Operations
        Task<string> BulkProcessFilesAsync(List<Guid> attachmentIds, string operationType);
        Task<string> BulkConvertFilesAsync(List<Guid> attachmentIds, string targetFormat);
        Task<string> BulkGeneratePreviewsAsync(List<Guid> attachmentIds);

        // File Transfer Operations
        Task<string> MoveFileAsync(Guid attachmentId, string newLocation);
        Task<string> CopyFileAsync(Guid attachmentId, string destination);
        Task<string> SyncFilesAsync(string sourcePath, string destinationPath);

        // Job Status and Results
        Task<FileJobStatusDto> GetFileJobStatusAsync(string jobId);
        Task<FileJobResultDto> GetFileJobResultAsync(string jobId);
        Task<bool> CancelFileJobAsync(string jobId);
        Task<List<FileJobStatusDto>> GetUserFileJobsAsync(string userId, int pageNumber = 1, int pageSize = 20);
    }
}
