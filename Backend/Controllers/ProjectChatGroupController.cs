using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Services;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectChatGroupController : ControllerBase
    {
        private readonly IProjectChatGroupService _chatGroupService;

        public ProjectChatGroupController(IProjectChatGroupService chatGroupService)
        {
            _chatGroupService = chatGroupService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateChatGroupDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var groupId = await _chatGroupService.CreateGroupAsync(dto, userId);
                return Ok(new { message = "✅ Group created", groupId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("project/{projectId}/groups")]
        public async Task<IActionResult> GetGroupsByProject(int projectId)
        {
            var groups = await _chatGroupService.GetGroupsByProjectIdAsync(projectId);
            return Ok(groups);
        }

        [HttpGet("group/{groupId}/messages")]
        public async Task<IActionResult> GetMessagesByGroup(int groupId)
        {
            var messages = await _chatGroupService.GetMessagesByGroupIdAsync(groupId);
            return Ok(messages);
        }
    }

}
