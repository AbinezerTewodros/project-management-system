namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class CreateProjectDto
    {
        public string ProjectName { get; set; }
        public string ProjectOwner { get; set; }
        public string ProjectOwnerPhone { get; set; }
        public string Department { get; set; }
        public string ProjectOwnerEmail { get; set; }
        public string Priority { get; set; } 
        public DateTime DueDate { get; set; }
        public string Status { get; set; } 
    }

}
