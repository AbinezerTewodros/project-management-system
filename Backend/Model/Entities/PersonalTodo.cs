using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class PersonalTodo
    {
        [Key]
        public int TodoId { get; set; }

        [Required]
        public string UserId { get; set; } // FK to ApplicationUser
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        [Required]
        public string Task { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Range(0, 100)]
        public int Progress { get; set; } = 0; // Optional: If you want to track progress numerically
    }
}