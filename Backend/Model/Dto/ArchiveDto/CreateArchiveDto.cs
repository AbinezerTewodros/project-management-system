using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Model.Dto.ArchiveDto
{
    public class CreateArchiveDto
    {
        public string EntityId { get; set; }
        public EntityType EntityType { get; set; }
    }

}
