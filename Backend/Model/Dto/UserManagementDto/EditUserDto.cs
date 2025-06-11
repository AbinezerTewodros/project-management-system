namespace ProjectManagementSystem1.Model.Dto.UserManagementDto
{
    public class EditUserDto
    {
        public string Identifier { get; set; } // Can be EmployeeId or Email
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        public string? Title { get; set; }
        public string? Company { get; set; }
        public string? Status { get; set; }
    }

}
