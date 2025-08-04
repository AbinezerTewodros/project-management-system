namespace ProjectManagementSystem1.Model.Dto.UserProfileDto
{
    public class UserProfileDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Department { get; set; }
        public string JobTitle { get; set; }
        public string Company { get; set; }
        public string UserName { get; set; }
        public string EmployeeId { get; set; }
        public DateTime? LastLogin { get; set; }
        public DateTime? LastPasswordChange { get; set; }
    }

}
