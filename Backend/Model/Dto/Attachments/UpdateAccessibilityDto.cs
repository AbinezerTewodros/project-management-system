using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Attachments
{
    public class UpdateAccessibilityDto
    {
        [Required]
        public AccessibilityLevel NewLevel { get; set; }
    }
}
