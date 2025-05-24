namespace ProjectManagementSystem1.Model.Dto
{
public class ProjectMessageDto
{
    public long MessageId { get; set; }

    public string Content { get; set; }

    public long SenderId { get; set; }
    public string SenderName { get; set; }

    public int? SenderDepartmentId { get; set; }

    public long ProjectId { get; set; }
    public string ProjectName { get; set; }

    public DateTime TimeSent { get; set; }
    public DateTime? TimeEdited { get; set; }

    public bool IsDeleted { get; set; }
    public int Version { get; set; }

    public AttachmentDto Attachment { get; set; }
}

}
