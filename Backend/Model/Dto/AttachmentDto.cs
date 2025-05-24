namespace ProjectManagementSystem1.Model.Dto
{
public class AttachmentDto
{
    public long AttachmentId { get; set; }
    public string FileName { get; set; }
    public string MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; }
}

}
