namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class AttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; }
        public string FilePhysicalPath { get; set; }
        public string? Url { get; set; } // Computed URL for accessing the file
        public DateTime CreatedAt { get; set; }
        public string UploadedByUserId { get; set; }
        public string? UploadedByUserName { get; set; }
    }
}
