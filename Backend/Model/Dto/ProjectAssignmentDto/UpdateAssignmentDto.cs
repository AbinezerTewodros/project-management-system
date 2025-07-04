using ProjectManagementSystem1.Model.Dto;

namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class UpdateAssignmentDto
    {
        public string MemberRole { get; set; }
        public string EmployeeId { get; set; }
        public int ProjectId { get; set; }
    }

}
