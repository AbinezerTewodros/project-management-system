using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.UserManagementDto
{
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Full Name is required")]
        public string FullName { get; set; }
        
        [Required(ErrorMessage = "Username is required")]
        public string Username { get; set; }
        
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }
        
        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
        
        public string Role { get; set; } // Optional: defaults to "User"
        
        [Required(ErrorMessage = "Department is required")]
        public string Department { get; set; }
        
        [Required(ErrorMessage = "Employee ID is required")]
        public string EmployeeId { get; set; }
        
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; }
        
        public string? Manager { get; set; }
        
        [Required(ErrorMessage = "Company is required")]
        public string Company { get; set; }
        
        public string PhoneNumber { get; set; }
    }
}
