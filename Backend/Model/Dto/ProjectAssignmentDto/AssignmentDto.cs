namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class AssignmentDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string MemberId { get; set; }
        public string EmployeeId { get; set; }
        public string MemberFullName { get; set; }
        public string MemberEmail { get; set; }
        public string MemberPhone { get; set; }
        public string MemberDepartment { get; set; }
        public string MemberRole { get; set; }
        public string Role { get; set; }

        public double Status { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreateUser { get; set; }
        public string UpdateUser { get; set; }
    }

}
