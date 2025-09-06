namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class AssignmentDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
                public string MemberId { get; set; }
        public string MemberFullName { get; set; }
        public string MemberRole { get; set; }

        public string Status { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreateUser { get; set; }
        public string UpdateUser { get; set; }
    }

}
