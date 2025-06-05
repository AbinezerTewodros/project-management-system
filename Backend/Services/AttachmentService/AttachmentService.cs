using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium.DevTools.V134.Browser;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Entities;
using PermissionType = ProjectManagementSystem1.Model.Entities.PermissionType;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;

namespace ProjectManagementSystem1.Services.AttachmentService
{
    public class AttachmentService : IAttachmentService
    {
        private readonly AppDbContext _context;

        public AttachmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Attachment> UploadAttachmentAsync(AttachmentUploadDto uploadDto, string uploadedByUserId)
        {
            var file = uploadDto.File;
            if (file == null || file.Length == 0)
            {
                throw new Exception("No file uploaded.");
            }

            var uploadFolderPath = @"C:\ProjectManagementSystem\Attachments"; // Use your desired local path
            if (!Directory.Exists(uploadFolderPath))
            {
                Directory.CreateDirectory(uploadFolderPath);
            }

            var fileName = Path.GetFileName(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}-{fileName}"; // Ensure unique filenames
            var filePath = Path.Combine(uploadFolderPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new Attachment
            {
                FileName = fileName,
                ContentType = file.ContentType,
                Category = uploadDto.Category,
                FileSize = file.Length,
                FilePhysicalPath = filePath,
                UploadedByUserId = uploadedByUserId,
                EntityId = uploadDto.EntityId,
                EntityType = uploadDto.EntityType,
                ProjectTaskId = uploadDto.ProjectTaskId,
                Checksum = CalculateChecksum(filePath) // Implement this method
            };

            await _context.Attachments.AddAsync(attachment);
            await _context.SaveChangesAsync();

            return attachment;

        }

        private string CalculateChecksum(string filePath)
        {
            using var stream = File.OpenRead(filePath);
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            byte[] hashbytes = sha256.ComputeHash(stream);

            return BitConverter.ToString(hashbytes).Replace("-", "").ToLowerInvariant();
        }

        public async Task<Attachment> GetAttachmentByIdAsync(Guid id)
        {
           
            return await _context.Attachments
                .Include(a => a.UploadedBy)
                .Include(a => a.ProjectTask)
                .FirstOrDefaultAsync(a => a.Id == id);

            return await _context.Attachments.FindAsync(id);
        }

        public async Task<IEnumerable<Attachment>> GetAttachmentByEntityAsync(string entityType, Guid entityId)
        {
            return await _context.Attachments
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .ToListAsync();
        }


        public async Task<AttachmentPermission> GrantPermissionAsync(Guid attachmentId, string userId, string roleId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType)
        {
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(roleId))
            {
                return null;
            }
            var existingPermission = await _context.AttachmentPermissions.FirstOrDefaultAsync(
                p => p.AttachmentId == attachmentId &&
                     p.PermissionType == permissionType &&
                     p.UserId == userId &&
                     p.RoleId == roleId
            );

            if (existingPermission != null)
            {
                return existingPermission;
            }

            var permission = new AttachmentPermission
            {
                AttachmentId = attachmentId,
                PermissionType = permissionType,
                UserId = userId,
                RoleId = roleId
            };

            _context.AttachmentPermissions.Add(permission);
            await _context.SaveChangesAsync();
            return permission;
        }

        public async Task<bool> RevokePermissionAsync(Guid attachmentId, string userId, string roleId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType)
        {
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty (roleId))
            {
                return false;
            }

            var permissionToRemove = await _context.AttachmentPermissions.FirstOrDefaultAsync
                (
                    p => p.AttachmentId == attachmentId &&
                    p.PermissionType == permissionType &&
                    p.UserId == userId &&
                    p.RoleId == roleId
                );

            if (permissionToRemove != null)
            {
                _context.AttachmentPermissions.Remove(permissionToRemove);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<bool> CheckPermissionAsync(Guid attachmentId, string userId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType)
        {

            var attachment = await _context.Attachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                return false;
            }

            if (attachment.UploadedByUserId == userId)
            {
                return true;
            }

            //if (permissionType == PermissionType.View && attachment.UploadedByUserId == userId)
            //{
            //    return true;
            //}
            // Check if there's a direct permission for the user
            var userPermission = await _context.AttachmentPermissions.AnyAsync(
                p => p.AttachmentId == attachmentId &&
                     p.UserId == userId &&
                     p.PermissionType == permissionType);

            if (userPermission)
            {
                return true;
            }

            // If no direct user permission, check for role-based permissions
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            if (userRoles.Any())
            {
                var rolePermission = await _context.AttachmentPermissions.AnyAsync(
                    p => p.AttachmentId == attachmentId &&
                         userRoles.Contains(p.RoleId) &&
                         p.PermissionType == permissionType);

                if (rolePermission)
                {
                    return true;
                }
            }

            return false; // No explicit permission found
        }

        public async Task<IEnumerable<AttachmentPermission>> GetPermissionsForAttachmentAsync(Guid attachmentId)
        {
            return await _context.AttachmentPermissions
                   .Where(p => p.AttachmentId == attachmentId)
                   .Include(p => p.User)
                   .Include(p => p.Role)
                   .ToListAsync();

        }

        public async Task<AttachmentPermission> GetPermissionByIdAsync(Guid id)
        {
            return await _context.AttachmentPermissions
                .Include(p => p.User)
                .Include(p => p.Role)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
        public async Task SoftDeleteAttachmentAsync(Guid id)
        {
            var attachment = await _context.Attachments.FindAsync(id);
            if (attachment != null && !attachment.IsDeleted)
            {
                attachment.IsDeleted = true;
                attachment.UpdatedAt = DateTime.UtcNow;
                _context.Attachments.Update(attachment);
                await _context.SaveChangesAsync();
            }
        }
    }
}
