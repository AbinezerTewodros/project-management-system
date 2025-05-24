namespace ProjectManagementSystem1.Model.Dto
{
public class PersonalMessageDto
{
    public long MessageId { get; set; }
    public string Content { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; }
    public long ReceiverId { get; set; }
    public string ReceiverName { get; set; }
    public int? SenderDepartmentId { get; set; }
    public int? ReceiverDepartmentId { get; set; }
    public DateTime TimeSent { get; set; }
    public DateTime? DeliveryTimeSeen { get; set; }
    public DateTime? TimeEdited { get; set; }
    public bool IsCurrentEmployee { get; set; }
    public AttachmentDto Attachment { get; set; }
    public int Version { get; set; }
}

}
