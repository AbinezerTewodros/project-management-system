using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagementSystem1.Models.Enums;

namespace ProjectManagementSystem1.Models.Entities.ProjectRequestEntities
{
    public class ProjectRequestStatusHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectRequestId { get; set; }

        [ForeignKey("ProjectRequestId")]
        public virtual ProjectRequest ProjectRequest { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string StatusID { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string StatusDescription { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? StatusDuration => EndDate.HasValue ? (int)(EndDate.Value - StartDate).TotalDays : null;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Active"; // Active, Inactive

        [Required]
        [StringLength(50)]
        public string StatusOwner { get; set; } = string.Empty; // AD User
    }
}