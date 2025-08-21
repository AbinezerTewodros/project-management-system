using ProjectManagementSystem1.Model.Dto.Attachments;

namespace ProjectManagementSystem1.Services.AttachmentService
{
    public interface IAttachmentPreviewService
    {
        Task<AttachmentPreviewDto> GeneratePreviewAsync(string filePath, string fileName, string contentType);
        Task<bool> IsPreviewableAsync(string contentType);
        Task<byte[]> GetThumbnailAsync(string filePath, string contentType, int width = 200, int height = 200);
        Task<string> GetPreviewUrlAsync(string filePath, string fileName);
    }

    public class AttachmentPreviewDto
    {
        public bool IsPreviewable { get; set; }
        public string PreviewType { get; set; } = string.Empty; // "image", "pdf", "text", "none"
        public string? PreviewUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? TextContent { get; set; }
        public long FileSize { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public Dictionary<string, object>? Metadata { get; set; }
    }
}
