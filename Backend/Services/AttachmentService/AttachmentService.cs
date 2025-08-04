using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenQA.Selenium.DevTools.V134.Browser;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.FileStorageService;
using ProjectManagementSystem1.Services.ResourceAcessService;
using ProjectManagementSystem1.Services.Validation;
using System.Security;
using PermissionType = ProjectManagementSystem1.Model.Entities.PermissionType;

namespace ProjectManagementSystem1.Services.AttachmentService
{
    public class AttachmentService : IAttachmentService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AttachmentService> _logger;
        private readonly IFileStorageService _fileStorageService;
        private IEntityValidator _entityValidator;
        private readonly IProjectMemberService _projectMemberService;
        public AttachmentService(AppDbContext context, ILogger<AttachmentService> logger, IProjectMemberService projectMemberService
            , IFileStorageService fileStorage, IEntityValidator entityValidator)
        {
            _context = context;
            _logger = logger;   
            _projectMemberService = projectMemberService;
            _fileStorageService = fileStorage;
            _entityValidator = entityValidator;
        }

        public async Task<Attachment> UploadAttachmentAsync(AttachmentUploadDto uploadDto, EntityContext context, string uploadedByUserId)
        {
            var file = uploadDto.File;

            if (file == null || file.Length == 0)
            {
                throw new Exception("No file uploaded.");
            }

            var entityType = context.IsValid ? context.EntityType : uploadDto.EntityType;
            var entityId = context.IsValid ? context.EntityId : uploadDto.EntityId;

            if (!await _entityValidator.ExistsAsync(entityType, entityId))
                throw new ArgumentException($"Invalid {entityType} ID");


            var filePath = await _fileStorageService.StoreAsync(
             file.OpenReadStream(),
             file.FileName
         );

            var attachment = new Attachment
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Category = uploadDto.Category,
                FileSize = file.Length,
                FilePhysicalPath = filePath,
                UploadedByUserId = uploadedByUserId,
                EntityId = entityId,
                EntityType = entityType,
                Accessibility = uploadDto.AccessibilityLevel,
                Checksum = CalculateChecksum(filePath),
                Metadata = new List<AttachmentMetadata>
            {
                new() { Key = "UploadedBy", Value = uploadedByUserId },
                new() { Key = "OriginalFileName", Value = file.FileName },
                new() { Key = "FileSizeBytes", Value = file.Length.ToString() },
                new() { Key = "ContentType", Value = file.ContentType }
            }
            };


            if (uploadDto.CustomMetadata != null)
            {
                foreach (var item in uploadDto.CustomMetadata)
                {
                    attachment.Metadata.Add(new AttachmentMetadata
                    {
                        Key = item.Key,
                        Value = item.Value
                    });
                }
            }

            await _context.Attachments.AddAsync(attachment);
            await _context.SaveChangesAsync();

            return attachment;

        }

        private async Task<bool> ValidateEntityExists(string entityType, string entityId)
        {
            return entityType switch
            {
                "Project" => await _context.Projects.AnyAsync(p => p.Id.ToString() == entityId),
                "ProjectTask" => await _context.ProjectTasks.AnyAsync(t => t.Id.ToString() == entityId),
                "Milestone" => await _context.Milestones.AnyAsync(m => m.AssignedMemberId.ToString() == entityId),
                "TodoItem" => await _context.TodoItems.AnyAsync(m => m.AssigneeId.ToString() == entityId),
                _ => false
            };
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
        }

        public async Task<IEnumerable<Attachment>> GetAttachmentByEntityAsync(string entityType, string entityId)
        {
            return await _context.Attachments
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .ToListAsync();
        }


        public async Task<AttachmentPermission> GrantPermissionAsync(Guid attachmentId, string userId, string roleId, ProjectManagementSystem1.Model.Entities.PermissionType permissionType)
        {
            if (!string.IsNullOrEmpty(userId) && !await _context.Users.AnyAsync(u => u.Id == userId))
                throw new ArgumentException("User not found");

            if (!string.IsNullOrEmpty(roleId) && !await _context.Roles.AnyAsync(r => r.Id == roleId))
                throw new ArgumentException("Role not found");

            if (!await _context.Attachments.AnyAsync(a => a.Id == attachmentId))
                throw new ArgumentException("Attachment not found");

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
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(roleId))
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
            var hasPermission = await _context.AttachmentPermissions
            .AnyAsync(p => p.AttachmentId == attachmentId &&
                (p.UserId == userId ||
                 _context.UserRoles.Any(ur =>
                     ur.UserId == userId &&
                     ur.RoleId == p.RoleId)) &&
                p.PermissionType == permissionType);

            return hasPermission; // No explicit permission found
        }

        //public async Task<IEnumerable<AttachmentPermission>> GetPermissionsForAttachmentAsync(Guid attachmentId)
        //{
        //    return await _context.AttachmentPermissions
        //.Where(p => p.AttachmentId == attachmentId)
        //.Include(p => p.User)  // Ensure correct navigation
        //.Include(p => p.Role)   // Ensure correct navigation
        //.Select(p => new AttachmentPermission
        //{
        //    Id = p.Id,
        //    AttachmentId = p.AttachmentId,
        //    UserId = p.UserId,
        //    RoleId = p.RoleId,
        //    PermissionType = p.PermissionType,
        //    User = p.User != null ? new ApplicationUser
        //    {
        //        Id = p.User.Id,
        //        UserName = p.User.UserName,
        //        Email = p.User.Email
        //    } : null,
        //    Role = p.Role != null ? new IdentityRole
        //    {
        //        Id = p.Role.Id,
        //        Name = p.Role.Name
        //    } : null
        //})
        //.ToListAsync();

        //}

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

      
        public async Task<List<Attachment>> QueryAttachmentsAsync(AttachmentQueryDto query)
        {
            var baseQuery = _context.Attachments
                .Include(a => a.Metadata)
                .Include(a => a.UploadedBy) // If you need user data
                .AsQueryable();

            // Metadata filters
            foreach (var filter in query.MetadataFilters)
            {
                baseQuery = baseQuery.Where(a =>
                    a.Metadata.Any(m =>
                        m.Key == filter.Key &&
                        m.Value == filter.Value));
            }

            // Size filters
            if (query.MinSizeBytes.HasValue || query.MaxSizeBytes.HasValue)
            {
                baseQuery = baseQuery.Where(a =>
                    a.Metadata.Any(m => m.Key == "FileSizeBytes"));

                if (query.MinSizeBytes.HasValue)
                {
                    baseQuery = baseQuery.Where(a =>
                        int.Parse(a.Metadata.First(m => m.Key == "FileSizeBytes").Value) >= query.MinSizeBytes);
                }

                if (query.MaxSizeBytes.HasValue)
                {
                    baseQuery = baseQuery.Where(a =>
                        int.Parse(a.Metadata.First(m => m.Key == "FileSizeBytes").Value) <= query.MaxSizeBytes);
                }
            }

            // Content type filter
            if (query.ContentTypes?.Any() == true)
            {
                baseQuery = baseQuery.Where(a =>
                    a.Metadata.Any(m =>
                        m.Key == "ContentType" &&
                        query.ContentTypes.Contains(m.Value)));
            }

            return await baseQuery
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task SoftDeleteAttachmentAsync(Guid id)
        {
            var attachment = await _context.Attachments.FindAsync(id);
            if (attachment == null || attachment.IsDeleted) return;

            attachment.IsDeleted = true;
            attachment.UpdatedAt = DateTime.UtcNow;

            try
            {
                System.IO.File.Delete(attachment.FilePhysicalPath); // Add this
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete physical file for attachment {Id}", id);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<(byte[] FileBytes, string ContentType, string FileName)>
    GetFileForDownloadAsync(Guid id)
        {
            var attachment = await _context.Attachments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attachment == null || attachment.IsDeleted)
                throw new FileNotFoundException("Attachment not found");

            return (
                await File.ReadAllBytesAsync(attachment.FilePhysicalPath),
                attachment.ContentType,
                attachment.FileName
            );
        }

        //public async Task<bool> CheckAccessAsync(Guid attachmentId, string userId, ProjectManagementSystem1.Model.Entities.PermissionType requiredPermission)
        //{
        //    var attachment = await _context.Attachments
        //  .AsNoTracking()
        //  .FirstOrDefaultAsync(a => a.Id == attachmentId);

        //    if (attachment == null) return false;

        //    // Handle Public access
        //    if (attachment.Accessibility == AccessibilityLevel.Public &&
        //        requiredPermission == PermissionType.View)
        //    {
        //        return true;
        //    }

        //    // Handle Private access
        //    if (attachment.Accessibility == AccessibilityLevel.Private)
        //    {
        //        return attachment.UploadedByUserId == userId;
        //    }

        //    // Handle Protected access
        //    if (attachment.Accessibility == AccessibilityLevel.Protected)
        //    {
        //        return await CheckPermissionAsync(attachmentId, userId, requiredPermission);
        //    }

        //    // Handle Internal access
        //    if (attachment.Accessibility == AccessibilityLevel.Internal)
        //    {
        //        // Simplified internal access check
        //        return await _context.ProjectAssignments
        //            .AnyAsync(pa => pa.ProjectId.ToString() == attachment.EntityId && pa.MemberId == userId);
        //    }

        //    return false;
        //}

        public async Task<bool> CheckAccessAsync(Guid attachmentId, string userId, PermissionType requiredPermission)
        {
            var attachment = await _context.Attachments
              .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null) return false;

            // Owner always has full access
            if (attachment.UploadedByUserId == userId)
                return true;

           
            var hasPermission = await _context.AttachmentPermissions
                  .AnyAsync(p => p.AttachmentId == attachmentId &&
                      (p.UserId == userId ||
                       p.RoleId != null && _context.UserRoles
                           .Any(ur => ur.UserId == userId && ur.RoleId == p.RoleId)) &&
                      p.PermissionType == requiredPermission);


            if (hasPermission) return true;

            if (attachment.Accessibility == AccessibilityLevel.Internal)
            {
                return await IsEntityMemberAsync(attachment.EntityType, attachment.EntityId, userId);
            }

            return false;
        }

        private async Task<bool> IsEntityMemberAsync(string entityType, string entityId, string userId)
        {
            return entityType switch
            {
                "Project" => await _context.ProjectAssignments
                    .AnyAsync(a => a.ProjectId.ToString() == entityId && a.MemberId == userId),
                "ProjectTask" => await _context.ProjectTasks
                    .AnyAsync(t => t.Id.ToString() == entityId && t.AssignedMemberId == userId),
                "Milestone" => await _context.Milestones
                    .AnyAsync(m => m.AssignedMemberId.ToString() == entityId && m.AssignedMemberId == userId),
                _ => false
            };
        }
    }
}
