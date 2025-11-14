using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public int UserCount { get; set; } // Number of users with this skill
        private List<SkillCategoryDto>? _cachedCategories;
        private List<RoleDto>? _cachedRoles;
        private readonly object _skillsLock = new();
        private readonly object _rolesLock = new();

    }
}
