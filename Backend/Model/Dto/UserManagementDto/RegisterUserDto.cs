namespace ProjectManagementSystem1.Model.Dto.UserManagementDto
{
    public class RegisterUserDto
    {
        public string FullName { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } // Optional: defaults to "User"
        public string Department { get; set; }
        public string EmployeeId { get; set; }
        public string Title { get; set; }
        public string? Manager { get; set; }
        public string Company { get; set; }
        public string PhoneNumber { get; set; }
    }
}
