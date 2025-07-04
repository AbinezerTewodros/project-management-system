namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class UpdateAssignmentDto
    {
        public string EmployeeId { get; set; }
        public int ProjectId { get; set; }
        public string MemberRole { get; set; } // For Edit
        //public string? Role { get; set; }
    }

}
