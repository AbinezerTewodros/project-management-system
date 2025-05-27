using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public string Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        // Optional: You might want to include a link or reference to the entity related to the notification
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
    }
}
