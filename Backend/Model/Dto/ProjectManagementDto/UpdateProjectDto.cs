using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Validation;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class UpdateProjectDto
    {
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Project name must be between 3 and 200 characters")]
        public string ProjectName { get; set; }

        [StringLength(100, ErrorMessage = "Project owner name cannot exceed 100 characters")]
        public string ProjectOwner { get; set; }

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string ProjectOwnerPhone { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string ProjectOwnerEmail { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority must be Low, Medium, High, or Critical")]
        public string Priority { get; set; }

        [FutureDate(ErrorMessage = "Due date must be in the future")]
        public DateTime DueDate { get; set; }

        [RegularExpression("^(Active|On Hold|Completed|Archived)$", ErrorMessage = "Status must be Active, On Hold, Completed, or Archived")]
        public string Status { get; set; }
    }
}
