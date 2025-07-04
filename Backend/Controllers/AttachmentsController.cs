using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AttachmentService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;

        public AttachmentsController(IAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpPost("permissions/grant")]
        public async Task<IActionResult> GrantAttachmentPermission([FromBody] GrantAttachmentPermissionDto dto)
        {
            if (string.IsNullOrEmpty(dto.UserId) && string.IsNullOrEmpty(dto.RoleId))
            {
                return BadRequest("Unable to grant permission: Either UserId or RoleId must be specified.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var permission = await _attachmentService.GrantPermissionAsync(dto.AttachmentId, dto.UserId, dto.RoleId, dto.PermissionType);
                if (permission == null)
                {
                    return BadRequest("Unable to grant permission");
                }
                return CreatedAtAction(nameof(GetPermission), new { id = permission.Id }, permission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

        }

        [HttpPost("permissions/revoke")]
        public async Task<IActionResult> RevokeAttachmentPermission([FromBody] RevokeAttachmentPermissionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var success = await _attachmentService.RevokePermissionAsync(dto.AttachmentId, dto.UserId, dto.RoleId, dto.PermissionType);
                if (success)
                {
                    return NoContent();
                }
                return NotFound("Permission not found or could not be revoked.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("permissions/{id}")]
        public async Task<IActionResult> GetPermission(Guid id)
        {
            var permission = await _attachmentService.GetPermissionByIdAsync(id);

            if (permission == null)
            {
                return NotFound();
            }

            return Ok(permission);
        }

        [HttpPost("Upload-File")]
        //[Authorize(Policy = "UserOnly")]
        public async Task<IActionResult> UploadAttachment([FromForm] AttachmentUploadDto uploadDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            try
            {
                // Validate that either ProjectId or ProjectTaskId is provided
                if (uploadDto.ProjectId == null && uploadDto.ProjectTaskId == null)
                {
                    return BadRequest("Either ProjectId or ProjectTaskId must be provided.");
                }

                // Call the service to upload the attachment
                var attachment = await _attachmentService.UploadAttachmentAsync(uploadDto, memberId);

                return CreatedAtAction(nameof(GetAttachment), new { id = attachment.Id }, attachment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpGet("Get-By-Id")]
        public async Task<IActionResult> GetAttachment(Guid id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                if (!await _attachmentService.CheckPermissionAsync(id, memberId, PermissionType.View))
                {
                    return Forbid();
                }
                return Ok(attachment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{projectId}/attachments")]
        public async Task<IActionResult> GetAttachments(int projectId)
        {
            try
            {
                var attachments = await _context.Attachments
                                             .Where(a => a.ProjectId == projectId && !a.IsDeleted)
                                             .ToListAsync();
                if (attachments == null || !attachments.Any())
                {
                    return NotFound();
                }
                return Ok(attachments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

            [HttpGet("{projectTaskId}/attachments")]
        public async Task<IActionResult> GetAttachments(int projectTaskId)
        {
            try
            {
                var attachments = await _context.Attachments
                                             .Where(a => a.ProjectId == projectTaskId && !a.IsDeleted)
                                             .ToListAsync();
                if (attachments == null || attachments.Any())
                {
                return NotFound();
                }
                return Ok(attachments);
                }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

[HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadAttachment(Guid id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }

            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                if (!await _attachmentService.CheckPermissionAsync(id, memberId, PermissionType.Download))
                {
                    return Forbid();
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePhysicalPath);

                return File(fileBytes, attachment.ContentType, attachment.FileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                // Log the error properly
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("list/{entityType}/{entitiyId}")]
        public async Task<IActionResult> ListAttachments(string entityType, Guid entitiyId)
        {
            try
            {
                var attachments = await _attachmentService.GetAttachmentByEntityAsync(entityType, entitiyId);
                return Ok(attachments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("permissions/{attachmentId}")]
        public async Task<IActionResult> GetAttachmentPermissions(Guid attachmentId)
        {
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(attachmentId);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                var permissions = await _attachmentService.GetPermissionsForAttachmentAsync(attachmentId);
                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(Guid id)
        {
            var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(memberId))
            {
                return Unauthorized();
            }
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                if (!await _attachmentService.CheckPermissionAsync(id, memberId, PermissionType.Delete))
                {
                    return Forbid();
                }

                await _attachmentService.SoftDeleteAttachmentAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

    }
}
