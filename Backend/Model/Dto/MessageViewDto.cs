namespace ProjectManagementSystem1.Model.Dto
{
public class MessageViewDto
{
    public long ViewId { get; set; }
    public long MessageId { get; set; }
    public long ViewerId { get; set; }
    public DateTime SeenTimestamp { get; set; }
    public string ViewerIp { get; set; }
    public string UserAgent { get; set; }
}

}
