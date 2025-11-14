using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagementSystem1.Models.Enums;

namespace ProjectManagementSystem1.Models.Entities.ProjectRequestEntities
{
    public class ProjectRequestAttachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectRequestId { get; set; }

        [ForeignKey("ProjectRequestId")]
        public virtual ProjectRequest ProjectRequest { get; set; } = null!;

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public FileType FileType { get; set; }

        [Required]
        public AttachmentCategory FileCategory { get; set; }

        [Required]
        public string BlobId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string UploadedBy { get; set; } = string.Empty;

        public DateTime UploadedOn { get; set; } = DateTime.UtcNow;

        [Url]
        public string? Links { get; set; }
    }
}