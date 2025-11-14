using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class SkillCategoryDto
    {
        public string Category { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
    }
}