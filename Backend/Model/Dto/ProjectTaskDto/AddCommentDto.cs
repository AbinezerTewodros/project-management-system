using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectTaskDto
{
    public class AddCommentDto
    {
        [Required]
        public string Content { get; set; }
    }
}
