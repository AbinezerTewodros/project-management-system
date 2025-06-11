using OpenQA.Selenium.DevTools.V134.Browser;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.AttachmentService
{
    public interface IAttachmentService
    {
        Task<Attachment> UploadAttachmentAsync(AttachmentUploadDto uploadDto, string uploadedByUserId);
        Task<Attachment> GetAttachmentByIdAsync(Guid id);
        Task<IEnumerable<Attachment>> GetAttachmentByEntityAsync(string entityType, Guid entityId);
        Task<AttachmentPermission> GetPermissionByIdAsync(Guid id);
        Task<AttachmentPermission> GrantPermissionAsync(Guid attachmentId, string userId, string roleId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType);
        Task<bool> RevokePermissionAsync(Guid attachmentId, string userId, string roleId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType);
        Task<bool> CheckPermissionAsync(Guid attachmentId, string userId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType);
        Task<IEnumerable<AttachmentPermission>> GetPermissionsForAttachmentAsync(Guid attachmentId); // Add this

        Task SoftDeleteAttachmentAsync(Guid id);
    }
}
