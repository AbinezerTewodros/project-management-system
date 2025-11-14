namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class MessageDto
    {
        public int MessageId { get; set; }
        public string Content { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string? ReceiverId { get; set; }
        public int? ProjectId { get; set; }
        public int MessageType { get; set; }
        public string? EmployeeId { get; set; } // For personal chat, this is the employee's ID which is mapped from sender
        public Guid? AttachmentId { get; set; }
        public bool IsRead { get; set; }
        public AttachmentDto? Attachment { get; set; }

        public DateTime TimeSent { get; set; }
        public DateTime? TimeEdited { get; set; }
    }
}
