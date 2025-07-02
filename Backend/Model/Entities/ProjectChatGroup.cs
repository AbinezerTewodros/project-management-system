namespace ProjectManagementSystem1.Model.Entities
{
    public class ProjectChatGroup
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string GroupName { get; set; } = null!;
        public string CreatedByUserId { get; set; } = null!;
        public DateTime CreatedDate { get; set; }

        // Navigation
        public Project Project { get; set; }
        public ApplicationUser CreatedBy { get; set; }
        public ICollection<ProjectChatGroupMember> Members { get; set; } = new List<ProjectChatGroupMember>();
    }

}
