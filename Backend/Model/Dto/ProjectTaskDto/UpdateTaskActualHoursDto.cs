using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectTaskDto
{
    public class UpdateTaskActualHoursDto
    {
        [Required]
        [Range(0, double.MaxValue)]
        public double ActualHours { get; set; }
    }
}
