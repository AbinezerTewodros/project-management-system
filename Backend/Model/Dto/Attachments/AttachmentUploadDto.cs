using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Attachments
{
    public class AttachmentUploadDto
    {
        [Required]
        public IFormFile File { get; set; }

        [Required]
        public AttachmentCategory Category { get; set; }

        public string EntityId { get; set; }

        
        public string EntityType { get; set; }

        public Dictionary<string, string>? CustomMetadata { get; set; } = new();

        [Required]
        [DefaultValue(AccessibilityLevel.Private)]
        public AccessibilityLevel AccessibilityLevel { get; set; } = AccessibilityLevel.Private;
    }
}
