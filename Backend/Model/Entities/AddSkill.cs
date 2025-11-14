using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Entities
{
    public class AddSkill
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(100)]
        public string NormalizedName { get; set; } // For search optimization

        [MaxLength(50)]
        public string Category { get; set; }

        public string Description { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public bool IsApproved { get; set; } = true; // Set false if using admin approval

        public int EndorsementCount { get; set; }

        // Navigation property
        public ICollection<UserSkill> UserSkills { get; set; }
    }
}
