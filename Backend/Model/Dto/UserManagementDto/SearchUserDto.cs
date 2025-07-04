namespace ProjectManagementSystem1.Model.Dto.UserManagementDto
{
    public class SearchUserDto
    {
        public string Id { get; set; }                  // User ID
        public string UserName { get; set; }            // Username (e.g., login ID)
        public string FullName { get; set; }            // Display name or full name
        public string Email { get; set; }               // Email address
        public string Department { get; set; }          // Department name
        //public List<string> Roles { get; set; }         // Optional: list of assigned roles
    }
}
