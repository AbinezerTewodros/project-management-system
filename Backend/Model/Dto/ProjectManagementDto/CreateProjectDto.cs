using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Validation;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    /// <summary>
    /// Data transfer object for creating a new project.
    /// Contains all required and optional fields for project creation.
    /// </summary>
    public class CreateProjectDto
    {
        /// <summary>
        /// The name of the project. Must be unique within the organization.
        /// </summary>
        [Required(ErrorMessage = "Project name is required")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Project name must be between 3 and 200 characters")]
        public string ProjectName { get; set; }

        [Required(ErrorMessage = "Project owner is required")]
        [StringLength(100, ErrorMessage = "Project owner name cannot exceed 100 characters")]
        public string ProjectOwner { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string ProjectOwnerPhone { get; set; }

        [StringLength(100, ErrorMessage = "Department name cannot exceed 100 characters")]
        public string? Department { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string ProjectOwnerEmail { get; set; }

        [Required(ErrorMessage = "Priority is required")]
        [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority must be Low, Medium, High, or Critical")]
        public string Priority { get; set; }

        [StringLength(50, ErrorMessage = "Assigned employee ID cannot exceed 50 characters")]
        public string? AssignedEmployeeId { get; set; }

        [StringLength(50, ErrorMessage = "Assigned role cannot exceed 50 characters")]
        [RegularExpression("^(ScrumMaster|TeamLeader|Developer|Tester|Analyst)$", ErrorMessage = "Role must be ScrumMaster, TeamLeader, Developer, Tester, or Analyst")]
        public string? AssignedRole { get; set; }

        [Required(ErrorMessage = "Due date is required")]
        [FutureDate(ErrorMessage = "Due date must be in the future")]
        public DateTime DueDate { get; set; }

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Active|On Hold|Completed|Archived)$", ErrorMessage = "Status must be Active, On Hold, Completed, or Archived")]
        public string Status { get; set; }
    }
}
