using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class IndependentTask
    {
        [Key]
        public int TaskId { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        public string AssignedToUserId { get; set; } // FK to ApplicationUser
        [ForeignKey("AssignedToUserId")]
        public ApplicationUser AssignedToUser { get; set; }

        public DateTime? DueDate { get; set; }

        public string Status { get; set; } // e.g., "Pending", "InProgress", "Completed"

        [Required]
        public string CreatedByUserId { get; set; } // FK to ApplicationUser
        [ForeignKey("CreatedByUserId")]
        public ApplicationUser CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Range(0, 100)]
        public double Progress { get; set; }
    }
}