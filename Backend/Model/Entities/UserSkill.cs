namespace ProjectManagementSystem1.Model.Entities
{
    public class UserSkill
    {
        public string UserId { get; set; } // Assuming GUID or string for identity
        public int SkillId { get; set; }

        public ProficiencyLevel? Proficiency { get; set; } // Enum if using proficiency levels
        public int EndorsementCount { get; set; } = 0;

        // Navigation properties
        public AddSkill Skill { get; set; }
        public ApplicationUser User { get; set; } // Your user entity
    }

    public enum ProficiencyLevel
    {
        Beginner,
        Intermediate,
        Advanced,
        Expert
    }
}
