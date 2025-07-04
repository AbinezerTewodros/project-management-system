using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class UpdateProjectDto
    {
        public string ProjectName { get; set; }
        public string ProjectOwner { get; set; }

        [Phone]
        public string ProjectOwnerPhone { get; set; }

        [EmailAddress]
        public string ProjectOwnerEmail { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; }

    }
}
