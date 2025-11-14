using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class SkillCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(50)]
        public string Category { get; set; }

        [StringLength(500)]
        public string Description { get; set; }
    }
}
