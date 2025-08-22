using System.IO;
using System.Text;
using ProjectManagementSystem1.Model.Dto.Attachments;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace ProjectManagementSystem1.Services.AttachmentService
{
    public class AttachmentPreviewService : IAttachmentPreviewService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AttachmentPreviewService> _logger;

        public AttachmentPreviewService(IConfiguration configuration, ILogger<AttachmentPreviewService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AttachmentPreviewDto> GeneratePreviewAsync(string filePath, string fileName, string contentType)
        {
            try
            {
                var fileInfo = new FileInfo(filePath);
                var isPreviewable = await IsPreviewableAsync(contentType);

                var previewDto = new AttachmentPreviewDto
                {
                    IsPreviewable = isPreviewable,
                    FileName = fileName,
                    ContentType = contentType,
                    FileSize = fileInfo.Length,
                    PreviewType = GetPreviewType(contentType)
                };

                if (!isPreviewable || !fileInfo.Exists)
                {
                    return previewDto;
                }

                // Generate preview based on content type
                switch (GetPreviewType(contentType))
                {
                    case "image":
                        previewDto.PreviewUrl = await GetPreviewUrlAsync(filePath, fileName);
                        previewDto.ThumbnailUrl = await GetPreviewUrlAsync(filePath, $"thumb_{fileName}");
                        break;

                    case "pdf":
                        previewDto.PreviewUrl = await GetPreviewUrlAsync(filePath, fileName);
                        break;

                    case "text":
                        previewDto.TextContent = await ExtractTextContentAsync(filePath, contentType);
                        break;
                }

                // Add metadata
                previewDto.Metadata = await ExtractMetadataAsync(filePath, contentType);

                return previewDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating preview for file: {FilePath}", filePath);
                return new AttachmentPreviewDto
                {
                    IsPreviewable = false,
                    FileName = fileName,
                    ContentType = contentType,
                    PreviewType = "none"
                };
            }
        }

        public async Task<bool> IsPreviewableAsync(string contentType)
        {
            var previewableTypes = new[]
            {
                // Images
                "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp",
                // PDFs
                "application/pdf",
                // Text files
                "text/plain", "text/csv", "text/html", "text/xml", "text/json",
                "application/json", "application/xml", "application/csv"
            };

            return previewableTypes.Contains(contentType.ToLower());
        }

        public async Task<byte[]> GetThumbnailAsync(string filePath, string contentType, int width = 200, int height = 200)
        {
            try
            {
                if (!contentType.StartsWith("image/"))
                {
                    throw new InvalidOperationException("Thumbnails can only be generated for images");
                }

                using var image = await Image.LoadAsync(filePath);
                image.Mutate(x => x.Resize(width, height));

                using var memoryStream = new MemoryStream();
                await image.SaveAsync(memoryStream, new JpegEncoder { Quality = 80 });
                return memoryStream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating thumbnail for file: {FilePath}", filePath);
                throw;
            }
        }

        public async Task<string> GetPreviewUrlAsync(string filePath, string fileName)
        {
            // In a real implementation, this would generate a secure URL
            // For now, return a placeholder URL
            return $"/api/attachments/preview/{fileName}";
        }

        private string GetPreviewType(string contentType)
        {
            if (contentType.StartsWith("image/"))
                return "image";
            if (contentType == "application/pdf")
                return "pdf";
            if (contentType.StartsWith("text/") || 
                contentType == "application/json" || 
                contentType == "application/xml" || 
                contentType == "application/csv")
                return "text";
            
            return "none";
        }

        private async Task<string> ExtractTextContentAsync(string filePath, string contentType)
        {
            try
            {
                // For text files, read the content
                if (contentType.StartsWith("text/") || 
                    contentType == "application/json" || 
                    contentType == "application/xml" || 
                    contentType == "application/csv")
                {
                    var content = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
                    // Limit content length for preview
                    return content.Length > 1000 ? content.Substring(0, 1000) + "..." : content;
                }

                return string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text content from file: {FilePath}", filePath);
                return string.Empty;
            }
        }

        private async Task<Dictionary<string, object>> ExtractMetadataAsync(string filePath, string contentType)
        {
            var metadata = new Dictionary<string, object>();
            var fileInfo = new FileInfo(filePath);

            metadata["FileSize"] = fileInfo.Length;
            metadata["LastModified"] = fileInfo.LastWriteTime;
            metadata["Created"] = fileInfo.CreationTime;

            if (contentType.StartsWith("image/"))
            {
                try
                {
                    using var image = await Image.LoadAsync(filePath);
                    metadata["Width"] = image.Width;
                    metadata["Height"] = image.Height;
                    metadata["Format"] = image.Metadata.DecodedImageFormat?.Name ?? "Unknown";
                }
                catch
                {
                    // Ignore image metadata extraction errors
                }
            }

            return metadata;
        }
    }
}
