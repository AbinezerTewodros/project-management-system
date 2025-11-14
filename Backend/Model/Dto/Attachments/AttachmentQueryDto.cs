namespace ProjectManagementSystem1.Model.Dto.Attachments
{
    public class AttachmentQueryDto
    {
        public Dictionary<string, string> MetadataFilters { get; set; } = new();
        public int? MinSizeBytes { get; set; }
        public int? MaxSizeBytes { get; set; }
        public string[]? ContentTypes { get; set; }
    }
}
