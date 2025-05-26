using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Comment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public ProjectTask Task { get; set; }

        [Required]
        public string MemberId { get; set; }

        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
