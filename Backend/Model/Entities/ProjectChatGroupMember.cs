namespace ProjectManagementSystem1.Model.Entities
{
    public class ProjectChatGroupMember
    {
        public int Id { get; set; }

        public int ChatGroupId { get; set; }
        public string UserId { get; set; }

        // Navigation
        public ProjectChatGroup ChatGroup { get; set; }
        public ApplicationUser User { get; set; }
    }

}
