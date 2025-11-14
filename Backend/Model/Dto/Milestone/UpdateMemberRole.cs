using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.MilestoneDto
{
    public class UpdateMemberRoleDto
    {
        [Required]
        public string Role { get; set; } = "Contributor";

        [Required]
        public bool IsLead { get; set; } = false;
    }
}
