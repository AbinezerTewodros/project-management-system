using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.ArchiveDto;
using ProjectManagementSystem1.Model.Enums;
using ProjectManagementSystem1.Services.ArchiveService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ArchiveController : ControllerBase
    {
        private readonly IArchiveService _archiveService;

        public ArchiveController(IArchiveService archiveService)
        {
            _archiveService = archiveService;
        }

        [HttpPost("archive")]
        public async Task<IActionResult> Archive([FromBody] CreateArchiveDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var result = await _archiveService.ArchiveEntityAsync(dto, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("unarchive")]
        public async Task<IActionResult> Unarchive(string entityId, EntityType entityType)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var result = await _archiveService.UnarchiveEntityAsync(entityId, entityType, userId);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-archives")]
        public async Task<IActionResult> MyArchives()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _archiveService.GetMyArchivesAsync(userId);
            return Ok(result);
        }
    }
}
