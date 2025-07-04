using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Milestone
    {
        [Key]
        public int MilestoneId { get; set; }

        [Required]
        public string MilestoneName { get; set; }

        public string Description { get; set; }
        public string AssignedMemberId { get; set; }

        [ForeignKey("AssignedMemberId")]
        public ApplicationUser AssignedMember { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Range(0, 100)]
        public int Weight { get; set; }
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Range(0, 100)]
        public double Progress { get; set; }
    }
}
