using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } 
        
        public string EmployeeId { get; set; }
        public string Department { get; set; }
        public string Title { get; set; }
        public string Company { get; set; }

        public bool IsFirstLogin { get; set; } = true;
        public string Status { get; set; } = "Active"; // Active (true) or Inactive (false)
        // Common fields
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime? ArchiveDate { get; internal set; }
        public DateTime? LastLogin { get; set; }
        public DateTime? LastPasswordChange { get; set; }
        [Timestamp]
        public byte[]? Version { get; set; }
        
        public string? AccessToken { get; set; } //  Add this
    }
}
