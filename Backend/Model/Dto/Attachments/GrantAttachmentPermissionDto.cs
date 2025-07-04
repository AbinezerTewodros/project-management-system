using OpenQA.Selenium.DevTools.V136.Browser;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.Attachments
{
    public class GrantAttachmentPermissionDto
    {
        [Required]
        public Guid AttachmentId { get; set; }

        public string UserId { get; set; }
        public string RoleId { get; set; }

        [Required]
        public ProjectManagementSystem1.Model.Entities.PermissionType PermissionType { get; set; }
    }
}
