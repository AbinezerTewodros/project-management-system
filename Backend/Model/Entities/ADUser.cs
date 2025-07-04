using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model
{
    public class ADUser
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string? Role { get; set; } = "User"; // default fallback
    }
}
