using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Attachments
{
    public class AttachmentAccessCheckDto
    {
        [Required]
        public Guid AttachmentId { get; set; }
        [Required]
        public PermissionType RequiredPermission { get; set; }
    }
}
