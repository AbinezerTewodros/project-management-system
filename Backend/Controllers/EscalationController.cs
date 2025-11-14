using Microsoft.AspNetCore.Mvc;
using Polly;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.EscalationDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.EscalationService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/escalation")]
    public class EscalationController : ControllerBase
    {
        private readonly IEscalationService _escalationService;
        private readonly ILogger<EscalationController> _logger;
        private readonly AppDbContext _context;

        public EscalationController(IEscalationService escalationService, ILogger<EscalationController> logger, AppDbContext context)
        {
            _escalationService = escalationService;
            _logger = logger;
            _context = context;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpPost("/api/escalation-send")]
        public async Task<ActionResult<EscalationDto>> SendEscalation([FromBody] SendEscalationDto dto)
        {
            var senderId = GetCurrentUserId();
            if (string.IsNullOrEmpty(senderId))
                return Unauthorized("User not authenticated");

            // Updated: Validate that UserIds are provided
            if (dto.UserIds == null || !dto.UserIds.Any())
                return BadRequest("At least one recipient is required");

            var created = await _escalationService.SendEscalationAsync(dto, senderId);
            return Ok(created);
        }

        [HttpPost("reply")]
        public async Task<ActionResult<EscalationReplyDto>> ReplyToEscalation([FromBody] EscalationReplyDto escalationReplyDto)
        {
            _logger.LogInformation("Starting ReplyToEscalation endpoint. Received DTO: {@Dto}", escalationReplyDto);

            // Input validation
            if (escalationReplyDto == null)
            {
                _logger.LogWarning("Request body is null");
                return BadRequest("Request body cannot be null");
            }

            if (escalationReplyDto.EscalationId <= 0)
            {
                _logger.LogWarning("Invalid escalation ID: {EscalationId}", escalationReplyDto.EscalationId);
                return BadRequest("Valid escalation ID is required");
            }

            if (string.IsNullOrWhiteSpace(escalationReplyDto.Content))
            {
                _logger.LogWarning("Empty content in escalation reply");
                return BadRequest("Reply content cannot be empty");
            }

            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User not authenticated");
                return Unauthorized("User not authenticated");
            }

            escalationReplyDto.SenderId = userId;

            _logger.LogInformation("Processing escalation reply. EscalationId: {EscalationId}, UserId: {UserId}",
                escalationReplyDto.EscalationId, userId);

            try
            {
                var result = await _escalationService.ReplyToEscalationAsync(escalationReplyDto);
                _logger.LogInformation("Successfully processed escalation reply");
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argument error in ReplyToEscalation: {Message}", ex.Message);
                return BadRequest(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in ReplyToEscalation: {Message}", ex.Message);
                return Unauthorized(ex.Message);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error in ReplyToEscalation. Inner Exception: {InnerException}",
                    dbEx.InnerException?.Message);
                return StatusCode(500, new
                {
                    message = "Database error occurred while saving reply.",
                    details = dbEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ReplyToEscalation. EscalationId: {EscalationId}, UserId: {UserId}. " +
                    "Stack Trace: {StackTrace}", escalationReplyDto.EscalationId, userId, ex.StackTrace);
                return StatusCode(500, new
                {
                    message = "An internal server error occurred.",
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("replies/{escalationId}")]
        public async Task<ActionResult<List<EscalationReplyDto>>> GetEscalationRepliesAsync(int escalationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User not authenticated");

                _logger.LogInformation("User {UserId} attempting to access replies for escalation {EscalationId}",
                    userId, escalationId);

                // Enhanced access validation
                var hasAccess = await _context.EscalationUsers
                    .AnyAsync(eu => eu.EscalationId == escalationId && eu.UserId == userId);

                // Also check if user is the sender
                var isSender = await _context.Escalations
                    .AnyAsync(e => e.Id == escalationId && e.SenderId == userId);

                if (!hasAccess && !isSender)
                {
                    _logger.LogWarning("User {UserId} attempted to access replies for escalation {EscalationId} without permission",
                        userId, escalationId);
                    return Forbid("You don't have access to this escalation");
                }

                var replies = await _escalationService.GetEscalationRepliesAsync(escalationId);
                _logger.LogInformation("Successfully retrieved {Count} replies for escalation {EscalationId}",
                    replies.Count, escalationId);

                return Ok(replies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving replies for escalation ID: {EscalationId}. Error: {ErrorMessage}",
                    escalationId, ex.Message);
                return StatusCode(500, new
                {
                    message = "An error occurred while retrieving replies.",
                    details = ex.Message,
                    escalationId = escalationId
                });
            }
        }

        [HttpGet("my-replies")]
        public async Task<ActionResult<List<EscalationReplyDto>>> GetMyReplies()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");
            try
            {
                var replies = await _escalationService.GetMyRepliesAsync(userId);
                return Ok(replies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving replies for user: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving your replies." });
            }
        }

        [HttpGet("sent")]
        public async Task<ActionResult<List<EscalationDto>>> GetEscalations()
        {
            var senderId = GetCurrentUserId();
            if (string.IsNullOrEmpty(senderId))
                return Unauthorized("User not authenticated");

            var escalations = await _escalationService.GetEscalationsAsync(senderId);
            return Ok(escalations);
        }

        [HttpGet("received")]
        public async Task<ActionResult<List<EscalationDto>>> GetMyEscalations()
        {
            var receiverId = GetCurrentUserId();
            if (string.IsNullOrEmpty(receiverId))
                return Unauthorized("User not authenticated");

            var escalations = await _escalationService.GetMyEscalationsAsync(receiverId);
            return Ok(escalations);
        }

        [HttpPut]
        public async Task<ActionResult> EditEscalation([FromBody] EditEscalationDto dto)
        {
            var senderId = GetCurrentUserId();
            if (string.IsNullOrEmpty(senderId))
                return Unauthorized("User not authenticated");

            var success = await _escalationService.EditEscalationAsync(dto, senderId);
            return success ? Ok() : NotFound();
        }

        [HttpPut("resolve/{escalationId}")]
        public async Task<ActionResult> ResolveEscalation(int escalationId)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            var success = await _escalationService.ResolveEscalationAsync(escalationId, userId);
            return success ? Ok() : NotFound();
        }

        [HttpPut("close/{escalationId}")]
        public async Task<ActionResult> CloseEscalation(int escalationId)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            var success = await _escalationService.CloseEscalationAsync(escalationId, userId);
            return success ? Ok() : NotFound();
        }

        [HttpGet("resolved")]
        public async Task<ActionResult<List<EscalationDto>>> GetResolvedEscalations()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            try
            {
                var escalations = await _escalationService.GetResolvedEscalationsAsync(userId);
                return Ok(escalations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving resolved escalations for user: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving resolved escalations." });
            }
        }

        [HttpGet("closed")]
        public async Task<ActionResult<List<EscalationDto>>> GetClosedEscalations()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            try
            {
                var escalations = await _escalationService.GetClosedEscalationsAsync(userId);
                return Ok(escalations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving closed escalations for user: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving closed escalations." });
            }
        }

        [HttpGet("my-resolved")]
        public async Task<ActionResult<List<EscalationDto>>> GetMyResolvedEscalations()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            try
            {
                var escalations = await _escalationService.GetMyResolvedEscalationsAsync(userId);
                return Ok(escalations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user's resolved escalations for user: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving your resolved escalations." });
            }
        }

        [HttpGet("my-closed")]
        public async Task<ActionResult<List<EscalationDto>>> GetMyClosedEscalations()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            try
            {
                var escalations = await _escalationService.GetMyClosedEscalationsAsync(userId);
                return Ok(escalations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user's closed escalations for user: {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving your closed escalations." });
            }
        }


        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadEscalationCount()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            var count = await _escalationService.GetUnreadEscalationCountAsync(userId);
            return Ok(count);
        }

        [HttpPut("mark-read/{escalationId}")]
        public async Task<ActionResult> MarkEscalationAsRead(int escalationId)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            var success = await _escalationService.MarkEscalationAsReadAsync(escalationId, userId);
            return success ? Ok() : NotFound();
        }
    }
}