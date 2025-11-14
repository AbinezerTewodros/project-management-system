using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class UserSkillDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; }
        public int EndorsementCount { get; set; }
        public ProficiencyLevel? Proficiency { get; set; }
    }

}
