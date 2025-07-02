namespace ProjectManagementSystem1.Model.Dto.Message
{
    public class CreateChatGroupDto
    {
        public int ProjectId { get; set; }
        public string GroupName { get; set; }
        public List<string> MemberEmployeeIds { get; set; } = new();
    }

}
