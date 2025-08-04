using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class AddSkillRequestDto
    {
        public int SkillId { get; set; }
        public ProficiencyLevel? Proficiency { get; set; }
    }
}
