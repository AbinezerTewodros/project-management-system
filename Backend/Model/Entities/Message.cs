using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.Mail;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Message
    {
        [Key]
        public int MessageId { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        public string SenderId { get; set; } //Internal user id

        [ForeignKey("SenderId")]
        public ApplicationUser Sender { get; set; }

        public string? ReceiverId { get; set; } // For personal chat

        [ForeignKey("ReceiverId")]
        public ApplicationUser? Receiver { get; set; }

        public int? ProjectId { get; set; } // For project messages

        [ForeignKey("ProjectId")]
        public Project? Project { get; set; }

        [Required]
        public int MessageType { get; set; } // 1 = Project, 2 = Department, 3 = Personal

        public Guid? AttachmentId { get; set; }

        [ForeignKey("AttachmentId")]
        public Attachment? Attachment { get; set; }

        public DateTime TimeSent { get; set; } = DateTime.UtcNow;
        public DateTime? TimeEdited { get; set; }

        public bool IsDeleted { get; set; } = false;
        public bool IsRead { get; set; } = false;
        public bool IsArchived { get; set; } = false; // default to not archived
        public ICollection<MessageReadStatus> ReadStatuses { get; set; }

        [Timestamp]
        public byte[] Version { get; set; }
    }
}
