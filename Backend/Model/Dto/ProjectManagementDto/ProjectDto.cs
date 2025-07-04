using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class ProjectDto
    {
        public int Id { get; set; }
        public string? Description { get; set; }
        public string ProjectName { get; set; }
        public string ProjectOwner { get; set; }

        [Phone]
        public string ProjectOwnerPhone { get; set; }

        [EmailAddress]
        public string ProjectOwnerEmail { get; set; }
        public string Priority { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreateUser { get; set; }
        public string UpdateUser { get; set; }
        public byte[] Version { get; set; }

    }
}
