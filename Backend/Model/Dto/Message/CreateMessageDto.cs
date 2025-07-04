using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class CreateMessageDto
    {
        public string Content { get; set; }
        public string? ReceiverId { get; set; } // for personal chat only
        public int? ProjectId { get; set; } // for project message

        [Range(1, 3, ErrorMessage = "MessageType must be 1 (Project), 2 (Department), or 3 (Personal)")]
        public int MessageType { get; set; } // 1=Project, 2=Dept, 3=Personal
        public Guid? AttachmentId { get; set; }
    }
}
