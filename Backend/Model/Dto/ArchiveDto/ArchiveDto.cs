using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Model.Dto.ArchiveDto
{
    public class ArchiveDto
    {
        public int Id { get; set; }
        public string EntityId { get; set; }
        public EntityType EntityType { get; set; }
        public string ArchivedBy { get; set; }
        public DateTime ArchivedDate { get; set; }
    }

}
