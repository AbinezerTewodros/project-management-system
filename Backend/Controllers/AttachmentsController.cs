using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Attachments;
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

        [HttpPost("Upload-File")]
        [Authorize(Policy = "UserOnly")]
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
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
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
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(Guid id)
        {
            try
            {
                var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
                if (attachment == null || attachment.IsDeleted)
                {
                    return NotFound();
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
