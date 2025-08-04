using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Attachments;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AttachmentDownloadSercvice;
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
        private readonly DownloadTokenService _downloadTokenService;
        private readonly ILogger<AttachmentsController> _logger;
        private readonly AppDbContext _context;

        public AttachmentsController(IAttachmentService attachmentService, DownloadTokenService downloadTokenService, ILogger<AttachmentsController> logger,
            AppDbContext context)
        {
            _attachmentService = attachmentService;
            _downloadTokenService = downloadTokenService;
            _logger = logger;
            _context = context;
        }

        [HttpPost("permissions/grant")]
        public async Task<IActionResult> GrantAttachmentPermission([FromBody] GrantAttachmentPermissionDto dto, Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
           

            // Verify user has permission to view permissions
            if (!await _attachmentService.CheckPermissionAsync(id, userId, PermissionType.View))
                return Forbid();

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

        //[HttpPost("Upload-File")]
        //[Authorize(Policy = "UserOnly")]
        //public async Task<IActionResult> UploadAttachment([FromForm] AttachmentUploadDto uploadDto, [FromForm] Dictionary<string, string> customMetadata)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }

        //    var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    if (string.IsNullOrEmpty(memberId))
        //    {
        //        return Unauthorized();
        //    }

        //    try
        //    {
        //        uploadDto.CustomMetadata = customMetadata;
        //        var attachment = await _attachmentService.UploadAttachmentAsync(uploadDto, memberId);
        //        return CreatedAtAction(nameof(GetAttachment), new { id = attachment.Id }, attachment);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"Internal server error: {ex.Message}");
        //    }
        //}

        [HttpPost("upload")]
        public async Task<IActionResult> UploadAttachment(
        [FromForm] AttachmentUploadDto uploadDto)
        {
            var context = EntityContext.FromRoute(HttpContext.GetRouteData());

            if (!context.IsValid && string.IsNullOrEmpty(uploadDto.EntityId))
            {
                return BadRequest("Could not determine attachment context. Either use entity-specific route or provide EntityId.");
            }

            try
            {
                var result = await _attachmentService.UploadAttachmentAsync(
                    uploadDto,
                    context,
                    User.FindFirstValue(ClaimTypes.NameIdentifier));

                return CreatedAtAction(nameof(GetAttachment), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("query")]
        public async Task<IActionResult> QueryAttachments([FromQuery] AttachmentQueryDto query)
        {
            try
            {
                var results = await _attachmentService.QueryAttachmentsAsync(query);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to query attachments");
                return StatusCode(500, "Error querying attachments");
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
                _logger.LogInformation($"Fetching permissions for {id}");
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                _logger.LogInformation($"Attachment found: {attachment != null}");
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                if (!await _attachmentService.CheckAccessAsync(id, memberId, PermissionType.View))
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

        //[HttpPost("check-access")]
        //public async Task<IActionResult> CheckAttachmentAccess(
        // [FromBody] AttachmentAccessCheckDto request)
        //{
        //    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    var hasAccess = await _attachmentService.CheckAccessAsync(
        //        request.AttachmentId,
        //        userId,
        //        request.RequiredPermission);

        //    return Ok(new { HasAccess = hasAccess });
        //}

        [HttpGet("{id}/check-access")]
        public async Task<IActionResult> CheckAccess(
        Guid id,
        [FromQuery] PermissionType permission)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var hasAccess = await _attachmentService.CheckAccessAsync(id, userId, permission);
            return Ok(new { hasAccess });
        }

        [HttpGet("{id}/download-token")]
        [Authorize] // Uses your existing JWT auth
        public IActionResult GetDownloadToken(Guid id)
        {
            var token = _downloadTokenService.GenerateToken(id, TimeSpan.FromMinutes(30));
            return Ok(new { token });
        }

        [HttpGet("secured-download/{id}")]
        public async Task<IActionResult> DownloadWithToken(
            Guid id,
            [FromQuery] string token)
        {
            _logger.LogInformation($"Download attempted for {id} from IP: {HttpContext.Connection.RemoteIpAddress}");
            // Validate token
            if (!_downloadTokenService.ValidateToken(token, id))
                return Forbid();

            // Get file (service handles errors)
            var result = await _attachmentService.GetFileForDownloadAsync(id);
            return File(result.FileBytes, result.ContentType, result.FileName);
        }

        //[HttpGet("download/{id}")]
        //public async Task<IActionResult> DownloadAttachment(Guid id)
        //{
        //    var memberId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    if (string.IsNullOrEmpty(memberId))
        //    {
        //        return Unauthorized();
        //    }

        //    try
        //    {
        //        var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
        //        if (attachment == null || attachment.IsDeleted)
        //        {
        //            return NotFound();
        //        }

        //        if (!await _attachmentService.CheckPermissionAsync(id, memberId, PermissionType.Download))
        //        {
        //            return Forbid();
        //        }

        //        var fileBytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePhysicalPath);

        //        return File(fileBytes, attachment.ContentType, attachment.FileName);
        //    }
        //    catch (FileNotFoundException)
        //    {
        //        return NotFound();
        //    }
        //    catch (Exception ex)
        //    {
        //        // Log the error properly
        //        return StatusCode(500, $"Internal server error: {ex.Message}");
        //    }
        //}

        [HttpGet("list/{entityType}/{entitiyId}")]
        public async Task<IActionResult> ListAttachments(string entityType, string entitiyId)
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
        [HttpGet("permissions/{id}")] // Change parameter name to match
        public async Task<IActionResult> GetAttachmentPermissions(Guid id) // Use 'id'
        {
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
                }

                var permissions = await _attachmentService.GetPermissionsForAttachmentAsync(id);
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

                if (!await _attachmentService.CheckAccessAsync(id, memberId, PermissionType.Delete))
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
