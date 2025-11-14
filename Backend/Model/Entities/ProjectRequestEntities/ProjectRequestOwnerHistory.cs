using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Models.Entities.ProjectRequestEntities
{
    public class ProjectRequestOwnerHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectRequestId { get; set; }

        [ForeignKey("ProjectRequestId")]
        public virtual ProjectRequest ProjectRequest { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string OwnerID { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string OwnerName { get; set; } = string.Empty; // AD User

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? OwnerDuration => EndDate.HasValue ? (int)(EndDate.Value - StartDate).TotalDays : null;

        [Required]
        [StringLength(50)]
        public string OwnerRole { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Active"; // Active, Inactive
    }
}