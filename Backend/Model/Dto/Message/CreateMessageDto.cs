namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class CreateMessageDto
    {
        public string Content { get; set; }
        public string? ReceiverId { get; set; } // for personal chat only
        public int? ProjectId { get; set; } // for project message
        public int MessageType { get; set; } // 1=Project, 2=Dept, 3=Personal
        public Guid? AttachmentId { get; set; }
    }
}
