using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Model.Entities
{
    public class Archive
    {
        public int Id { get; set; }
        public string EntityId { get; set; } // Can store Guid, int, or string as text
        public EntityType EntityType { get; set; }
        public string ArchivedBy { get; set; } // UserId
        public DateTime ArchivedDate { get; set; }
        public byte[] Version { get; set; }
    }

}
