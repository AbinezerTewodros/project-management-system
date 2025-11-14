using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.AddSkill
{
    public class RoleDto
    {
        public string Role { get; set; } = string.Empty;
        public List<string> Aliases { get; set; } = new();
        public List<string> Seniority { get; set; } = new();
        public List<string> PrimaryCategories { get; set; } = new();
        public List<string> RecommendedSkills { get; set; } = new();
        public List<string> OptionalSkills { get; set; } = new();
    }
}