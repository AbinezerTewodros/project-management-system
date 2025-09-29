namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class UserProjectDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string Priority { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; }
        public string MemberRole { get; set; }
        public double MemberProgress { get; set; }
    }

}
