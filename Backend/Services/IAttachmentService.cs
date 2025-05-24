namespace ProjectMangementSystem1.Services
{
public interface IAttachmentService
{
    Task<AttachmentDto> UploadAsync(IFormFile file, long uploadedBy);
    Task<FileStreamResult> DownloadAsync(long id);
    Task<bool> SoftDeleteAsync(long id, long userId);
}
}
