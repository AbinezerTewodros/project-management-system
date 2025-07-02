namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class ProjectChatGroupDto
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public DateTime CreatedDate { get; set; }
        public int MemberCount { get; set; }
    }

}
