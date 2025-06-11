using OpenQA.Selenium.DevTools.V134.Browser;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public enum PermissionType
    {
        View,
        Download,
        Delete
        // Add other permission types as needed (e.g., Edit)
    }
    public class AttachmentPermission
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid AttachmentId { get; set; }

        [ForeignKey("AttachmentId")]
        public Attachment Attachment { get; set; }

        public string UserId { get; set; } // Foreign Key to ApplicationUser

        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        public string RoleId { get; set; } // Foreign Key to IdentityRole

        [ForeignKey("RoleId")]
        public Microsoft.AspNetCore.Identity.IdentityRole Role { get; set; }

        [Required]
        public ProjectManagementSystem1.Model.Entities.PermissionType PermissionType { get; set; }
    }
}
