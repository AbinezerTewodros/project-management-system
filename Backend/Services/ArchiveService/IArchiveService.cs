using ProjectManagementSystem1.Model.Dto.ArchiveDto;
using ProjectManagementSystem1.Model.Enums;

namespace ProjectManagementSystem1.Services.ArchiveService
{
    public interface IArchiveService
    {
        Task<ArchiveDto> ArchiveEntityAsync(CreateArchiveDto dto, string userId);
        Task<bool> UnarchiveEntityAsync(string entityId, EntityType entityType, string userId);
        Task<List<ArchiveDto>> GetMyArchivesAsync(string userId);
    }

}
