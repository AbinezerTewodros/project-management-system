using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.UserProfileDto
{
    public class UpdateProfileDto
    {
        [Required]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Phone]
        public string PhoneNumber { get; set; }
    }

}
