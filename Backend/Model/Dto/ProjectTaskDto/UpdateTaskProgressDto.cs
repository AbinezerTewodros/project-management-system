using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectTaskDto
{
    public class UpdateTaskProgressDto
    {
        [Required]
        [Range(0, 100)]
        public double Progress { get; set; }
    }
}
