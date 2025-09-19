using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.MessageService;
using ProjectManagementSystem1.Services.UserService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/message")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserService _userService;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;


        public MessageController(IMessageService messageService, IUserService userService, AppDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager)
        {
            _messageService = messageService;
            _userService = userService;
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }

        [HttpPost("Send-Message")]
        public async Task<IActionResult> SendMessage(CreateMessageDto dto)
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(senderId);
            if (user == null) return Unauthorized("User not found.");

            try
            {
                // Validate messageType
                if (dto.MessageType is < 1 or > 3)
                    return BadRequest("MessageType must be 1 (Project), 2 (Department), or 3 (Personal).");

                // MessageType 1 = Project
                if (dto.MessageType == 1)
                {
                    if (dto.ProjectId == null)
                        return BadRequest("ProjectId is required for project messages.");

                    var projectMembers = await _context.ProjectAssignments
                        .Where(pa => pa.ProjectId == dto.ProjectId)
                        .Select(pa => pa.MemberId)
                        .ToListAsync();

                    if (!projectMembers.Contains(senderId))
                        return Forbid("You are not a member of this project.");
                }

                // MessageType 2 = Department
                if (dto.MessageType == 2)
                {
                    dto.ProjectId = null;
                    dto.ReceiverId = null;
                }

                // MessageType 3 = Personal
                if (dto.MessageType == 3)
                {
                    if (string.IsNullOrWhiteSpace(dto.ReceiverId))
                        return BadRequest("Receiver EmployeeId is required.");

                    var receiver = await _userService.GetUserByEmployeeIdAsync(dto.ReceiverId);
                    if (receiver == null)
                        return NotFound("Receiver not found.");

                    dto.ReceiverId = receiver.Id;
                    dto.ProjectId = null;
                }

                var result = await _messageService.SendMessageAsync(dto, senderId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("department")]
        public async Task<IActionResult> GetDepartmentMessages()
        {
            var dept = User.FindFirst("Department")?.Value;
            var messages = await _messageService.GetDepartmentMessagesAsync(dept);
            return Ok(messages);
        }


        [HttpGet("project")]
        public async Task<IActionResult> GetProjectMessages()
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Get all project IDs the user is assigned to
            var projectIds = await _context.ProjectAssignments
                .Where(pa => pa.MemberId == senderId)
                .Select(pa => pa.ProjectId)
                .ToListAsync();

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m =>
                    m.MessageType == 1 &&
                    m.ProjectId.HasValue &&
                    projectIds.Contains(m.ProjectId.Value) &&
                    !m.IsDeleted)
                .OrderBy(m => m.TimeSent)
                .ToListAsync();

            var mapped = _mapper.Map<List<MessageDto>>(messages);
            return Ok(mapped);
        }

        [HttpGet("personal")]
        public async Task<IActionResult> GetPersonalMessages()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var messages = await _messageService.GetPersonalMessagesAsync(currentUserId);
            return Ok(messages);
        }

        [HttpPut("edit")]
        public async Task<IActionResult> EditMessage([FromBody] EditMessageDto dto)
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var result = await _messageService.EditMessageAsync(dto, senderId);
                return result ? Ok("✅ Message edited.") : BadRequest("Failed to edit message.");
            }
            catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("delete/{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var result = await _messageService.SoftDeleteMessageAsync(messageId, senderId);
                return result ? Ok("🗑️ Message deleted (soft).") : BadRequest("Failed to delete.");
            }
            catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        //[HttpGet("Personal-unread-count")]
        //[Authorize]
        //public async Task<IActionResult> GetUnreadMessageCount()
        //{
        //    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //    if (string.IsNullOrEmpty(userId))
        //        return Unauthorized("Invalid user");

        //    var count = await _messageService.GetUnreadMessageCountAsync(userId);
        //    return Ok(new { unreadCount = count });
        //}

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Personal messages
            var personalUnread = await _context.Messages
                .Where(m => m.MessageType == 3 && m.ReceiverId == userId && !m.IsRead && !m.IsDeleted)
                .CountAsync();

            // Group messages
            var groupUnread = await _context.MessageReadStatuses
                .Where(r => r.UserId == userId && !r.IsRead)
                .CountAsync();

            return Ok(new { personalUnread, groupUnread, total = personalUnread + groupUnread });
        }

        [HttpPost("mark-read/{messageId}")]
        [Authorize]
        public async Task<IActionResult> MarkMessageAsRead(int messageId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.MessageId == messageId && m.ReceiverId == userId);

            if (message == null) return NotFound("Message not found or access denied.");

            message.IsRead = true;
            //message.UpdatedDate = DateTime.UtcNow;
            //message.UpdateUser = userId;

            await _context.SaveChangesAsync();
            return Ok("✅ Message marked as read.");
        }

        [HttpPost("mark-group-message-read/{messageId}")]
        public async Task<IActionResult> MarkGroupMessageAsRead(int messageId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var status = await _context.MessageReadStatuses
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);

            if (status == null)
                return NotFound("Message not assigned or already marked.");

            if (status.IsRead)
                return BadRequest("Already marked as read.");

            status.IsRead = true;
            status.ReadTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok("✅ Group message marked as read.");
        }

    }
}
