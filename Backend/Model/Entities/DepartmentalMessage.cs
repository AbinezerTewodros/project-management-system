using ProjectManagementSytem1.Model.Entities;

namespace ProjectManagementSytem1.Model.Entities
{
public class DepartmentalMessage
{
    [Key]
    public long MessageId { get; set; }

    [Required]
    public string Content { get; set; }

    public long SenderId { get; set; }
    public string SenderName { get; set; }

    public int? SenderDepartmentId { get; set; }
    public int ReceiverDepartmentId { get; set; }

    public DateTime TimeSent { get; set; }
    public DateTime? TimeEdited { get; set; }

    public long? AttachmentId { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;

    public Attachment Attachment { get; set; }
    public ICollection<MessageView> Views { get; set; }
}

}
