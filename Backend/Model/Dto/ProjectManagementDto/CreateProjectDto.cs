using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class CreateProjectDto
    {
        public string ProjectName { get; set; }
        public string ProjectOwner { get; set; }

        [Phone]
        public string ProjectOwnerPhone { get; set; }
        public string? Department { get; set; }
        public string Description { get; set; }
        [EmailAddress]
        public string ProjectOwnerEmail { get; set; }
        public string Priority { get; set; }
        public string? AssignedEmployeeId { get; set; } // new field for assignment
        public string? AssignedRole { get; set; } // e.g. "ScrumMaster", "TeamLeader"

        public DateTime DueDate { get; set; }
        public string Status { get; set; } 

    }

}
