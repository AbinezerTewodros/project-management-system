namespace ProjectManagementSystem1.Model.Dto.EscalationDto
{
    public class EscalationReplyDto
    {
        public int EscalationId { get; set; }
        public string Content { get; set; }
        // Clear sender/receiver separation
        public string SenderId { get; set; } // Who sent this reply
        public string ReceiverId { get; set; } // Who receives this reply
        public DateTime TimeSent { get; set; }

        // Optional: Additional info for better UX
        public string UserName { get; set; }
        public string EscalationTitle { get; set; }
        public string SenderName { get; set; }
        public string ReceiverName { get; set; }
    }
}
