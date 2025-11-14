using Humanizer;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.EscalationDto;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.EscalationService
{
    public class EscalationService : IEscalationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EscalationService> _logger;

        public EscalationService(AppDbContext context, ILogger<EscalationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<EscalationDto> SendEscalationAsync(SendEscalationDto dto, string senderId)
        {
            _logger.LogInformation("Attempting to send escalation. Sender: {SenderId}, Type: {Type}", senderId, dto.Type);

            // Validate input
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            if (string.IsNullOrEmpty(senderId))
            {
                throw new ArgumentException("Sender ID cannot be null or empty", nameof(senderId));
            }

            var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderId);
            if (sender == null)
            {
                _logger.LogWarning("Sender not found. SenderId: {SenderId}", senderId);
                throw new Exception("Sender not found");
            }

            if (dto.UserIds == null || !dto.UserIds.Any())
            {
                _logger.LogWarning("No recipient user IDs provided");
                throw new Exception("At least one recipient user ID is required");
            }

            var users = await _context.Users.Where(u => dto.UserIds.Contains(u.Id)).ToListAsync();
            if (users.Count != dto.UserIds.Count)
            {
                _logger.LogWarning("One or more recipient user IDs not found. Expected: {ExpectedCount}, Found: {FoundCount}",
                    dto.UserIds.Count, users.Count);
                throw new Exception("One or more recipient user IDs not found");
            }

            try
            {
                var escalation = new Escalation
                {
                    Title = dto.Title ?? string.Empty,
                    Type = dto.Type ?? string.Empty,
                    ProjectId = dto.ProjectId,
                    ProjectTaskId = dto.ProjectTaskId,
                    IndependentTaskId = dto.IndependentTaskId,
                    MilestoneId = dto.MilestoneId,
                    Content = dto.Content ?? string.Empty,
                    TimeSent = DateTime.UtcNow,
                    Receiver = users,
                    SenderId = senderId,
                    AttachmentId = dto.AttachmentId != Guid.Empty ? dto.AttachmentId : null,
                    ResponseTimeLimit = dto.ResponseTimeLimit,
                    Status = EscalationStatus.Active,
                    EscalationLevel = dto.EscalationLevel, // Set the escalation level
                };

                _context.Escalations.Add(escalation);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Escalation created with ID: {EscalationId}, Level: {EscalationLevel}",
                    escalation.Id, escalation.EscalationLevel);

                // Create EscalationUser entries to track read status
                foreach (var user in users)
                {
                    _context.EscalationUsers.Add(new EscalationUser
                    {
                        EscalationId = escalation.Id,
                        UserId = user.Id,
                        IsRead = false
                    });
                }
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created {Count} EscalationUser entries for escalation ID: {EscalationId}",
                    users.Count, escalation.Id);

                var createdEscalation = await _context.Escalations
                    .Include(e => e.EscalationUsers)
                    .ThenInclude(eu => eu.User)
                    .Include(e => e.Sender)
                    .FirstOrDefaultAsync(e => e.Id == escalation.Id);

                return MapToEscalationDto(createdEscalation!);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error while creating escalation");
                throw new Exception("Database error occurred while creating escalation", dbEx);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating escalation");
                throw;
            }
        }

        // REMOVED DUPLICATE METHODS - Keeping only one version of each

        public async Task<List<EscalationDto>> GetResolvedEscalationsAsync(string userId)
        {
            _logger.LogInformation("Retrieving resolved escalations for user: {UserId}", userId);

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => e.Status == EscalationStatus.Resolved &&
                           (e.SenderId == userId || e.EscalationUsers.Any(eu => eu.UserId == userId)))
                .ToListAsync();

            _logger.LogInformation("Found {Count} resolved escalations for user: {UserId}", escalations.Count, userId);
            return escalations.Select(e => MapToEscalationDto(e)).ToList(); // Fixed: Removed userId parameter
        }

        public async Task<List<EscalationDto>> GetClosedEscalationsAsync(string userId)
        {
            _logger.LogInformation("Retrieving closed escalations for user: {UserId}", userId);

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => e.Status == EscalationStatus.Closed &&
                           (e.SenderId == userId || e.EscalationUsers.Any(eu => eu.UserId == userId)))
                .ToListAsync();

            _logger.LogInformation("Found {Count} closed escalations for user: {UserId}", escalations.Count, userId);
            return escalations.Select(e => MapToEscalationDto(e)).ToList(); // Fixed: Removed userId parameter
        }

        public async Task<List<EscalationDto>> GetMyResolvedEscalationsAsync(string userId)
        {
            _logger.LogInformation("Retrieving escalations resolved by user: {UserId}", userId);

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => e.Status == EscalationStatus.Resolved && e.SenderId == userId)
                .ToListAsync();

            _logger.LogInformation("Found {Count} escalations resolved by user: {UserId}", escalations.Count, userId);
            return escalations.Select(e => MapToEscalationDto(e)).ToList(); // Fixed: Removed userId parameter
        }

        public async Task<List<EscalationDto>> GetMyClosedEscalationsAsync(string userId)
        {
            _logger.LogInformation("Retrieving escalations closed by user: {UserId}", userId);

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => e.Status == EscalationStatus.Closed && e.SenderId == userId)
                .ToListAsync();

            _logger.LogInformation("Found {Count} escalations closed by user: {UserId}", escalations.Count, userId);
            return escalations.Select(e => MapToEscalationDto(e)).ToList(); // Fixed: Removed userId parameter
        }

        public async Task<bool> ResolveEscalationAsync(int escalationId, string userId)
        {
            _logger.LogInformation("Resolving escalation {EscalationId} by user {UserId}", escalationId, userId);

            var escalation = await _context.Escalations
                .Include(e => e.EscalationUsers)
                .FirstOrDefaultAsync(e => e.Id == escalationId);

            if (escalation == null)
            {
                _logger.LogWarning("Escalation {EscalationId} not found", escalationId);
                return false;
            }

            // Check if user has access to this escalation (sender or receiver)
            var hasAccess = escalation.SenderId == userId ||
                           await _context.EscalationUsers.AnyAsync(eu => eu.EscalationId == escalationId && eu.UserId == userId);

            if (!hasAccess)
            {
                _logger.LogWarning("User {UserId} does not have access to resolve escalation {EscalationId}", userId, escalationId);
                return false;
            }

            escalation.Status = EscalationStatus.Resolved;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Escalation {EscalationId} resolved by user {UserId}", escalationId, userId);
            return true;
        }

        public async Task<bool> CloseEscalationAsync(int escalationId, string userId)
        {
            _logger.LogInformation("Closing escalation {EscalationId} by user {UserId}", escalationId, userId);

            var escalation = await _context.Escalations
                .Include(e => e.EscalationUsers)
                .FirstOrDefaultAsync(e => e.Id == escalationId);

            if (escalation == null)
            {
                _logger.LogWarning("Escalation {EscalationId} not found", escalationId);
                return false;
            }

            // Only sender can close escalation
            if (escalation.SenderId != userId)
            {
                _logger.LogWarning("User {UserId} is not the sender of escalation {EscalationId}", userId, escalationId);
                return false;
            }

            escalation.Status = EscalationStatus.Closed;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Escalation {EscalationId} closed by sender {UserId}", escalationId, userId);
            return true;
        }

        // For background service to escalate to managers
        public async Task EscalateToManagerAsync(int escalationId)
        {
            var escalation = await _context.Escalations
                .Include(e => e.Receiver)
                .FirstOrDefaultAsync(e => e.Id == escalationId);

            if (escalation == null)
            {
                _logger.LogInformation("Escalation {EscalationId} not found", escalationId);
                return;
            }

            // Check if escalation is already in a terminal state
            if (escalation.Status != EscalationStatus.Active)
            {
                _logger.LogInformation("Escalation {EscalationId} is in {Status} state; no escalation needed.",
                    escalationId, escalation.Status);
                return;
            }

            // Check if there are any replies
            var hasReplies = await _context.EscalationReplies
                .AnyAsync(r => r.EscalationId == escalationId);

            if (hasReplies)
            {
                _logger.LogInformation("Escalation {EscalationId} has replies; updating status to Responded.", escalationId);
                escalation.Status = EscalationStatus.Responded;
                await _context.SaveChangesAsync();
                return;
            }

            // Get the immediate managers of all receivers using ReportsToUserId
            var receiverIds = escalation.Receiver.Select(r => r.Id).ToList();
            var managers = await FindManagers(receiverIds);

            if (!managers.Any())
            {
                _logger.LogInformation("No managers found for receivers of escalation {EscalationId}; marking as Closed.", escalationId);
                escalation.Status = EscalationStatus.Closed;
                await _context.SaveChangesAsync();
                return;
            }

            try
            {
                var newEscalationDto = new SendEscalationDto
                {
                    Title = $"Escalated: {escalation.Title}",
                    Content = escalation.Content,
                    Type = escalation.Type,
                    ProjectId = escalation.ProjectId,
                    ProjectTaskId = escalation.ProjectTaskId,
                    IndependentTaskId = escalation.IndependentTaskId,
                    MilestoneId = escalation.MilestoneId,
                    UserIds = managers.Select(m => m.Id).ToList(),
                    AttachmentId = escalation.AttachmentId ?? Guid.Empty,
                    ResponseTimeLimit = DateTime.UtcNow.AddHours(24),
                    Status = EscalationStatus.Active,
                    EscalationLevel = escalation.EscalationLevel + 1
                };

                await SendEscalationAsync(newEscalationDto, escalation.SenderId);

                // Update original escalation status to Escalated
                escalation.Status = EscalationStatus.Escalated;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully escalated escalation {EscalationId} to managers: {ManagerIds}, New Level: {EscalationLevel}",
                    escalationId, string.Join(", ", newEscalationDto.UserIds), newEscalationDto.EscalationLevel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to escalate escalation {EscalationId} to managers", escalationId);
                // Let background service retry later
            }
        }

        public async Task<EscalationReplyDto> ReplyToEscalationAsync(EscalationReplyDto dto)
        {
            _logger.LogInformation("Attempting to reply to escalation. Escalation ID: {EscalationId}", dto.EscalationId);

            if (string.IsNullOrEmpty(dto.Content))
            {
                throw new ArgumentException("Reply content cannot be empty", nameof(dto.Content));
            }

            // Get the escalation with sender and receiver information
            var escalation = await _context.Escalations
                .Include(e => e.Sender)
                .Include(e => e.Receiver)
                .FirstOrDefaultAsync(e => e.Id == dto.EscalationId);

            if (escalation == null)
            {
                _logger.LogWarning("Escalation not found. ID: {EscalationId}", dto.EscalationId);
                throw new ArgumentException("Escalation not found", nameof(dto.EscalationId));
            }

            // Validate that the current user exists
            var currentUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == dto.SenderId);

            if (currentUser == null)
            {
                _logger.LogWarning("User not found. UserId: {UserId}", dto.SenderId);
                throw new ArgumentException("User not found", nameof(dto.SenderId));
            }

            // Create the reply
            var reply = new EscalationReply
            {
                EscalationId = dto.EscalationId,
                Content = dto.Content,
                SenderId = dto.SenderId,
                ReceiverId = escalation.SenderId, // The escalation sender becomes the receiver
                TimeSent = DateTime.UtcNow
            };

            _context.EscalationReplies.Add(reply);

            // Update escalation status to Responded when someone replies
            escalation.Status = EscalationStatus.Responded;

            await _context.SaveChangesAsync();

            // Reload the reply with included entities to get names
            var savedReply = await _context.EscalationReplies
                .Include(r => r.Sender)
                .Include(r => r.Receiver)
                .Include(r => r.Escalation)
                .FirstOrDefaultAsync(r => r.Id == reply.Id);

            _logger.LogInformation("Reply created. Escalation ID: {EscalationId}, Sender: {SenderId}, Receiver: {ReceiverId}",
                dto.EscalationId, dto.SenderId, escalation.SenderId);

            return new EscalationReplyDto
            {
                EscalationId = savedReply.EscalationId,
                Content = savedReply.Content,
                SenderId = savedReply.SenderId,
                ReceiverId = savedReply.ReceiverId,
                TimeSent = savedReply.TimeSent,
                SenderName = savedReply.Sender?.UserName,
                ReceiverName = savedReply.Receiver?.UserName,
                EscalationTitle = savedReply.Escalation?.Title
            };
        }

        // Updated: Uses ManagerId directly on ApplicationUser, removing Team dependency
        // Assumes ApplicationUser has: public string ManagerId { get; set; } and [ForeignKey("ManagerId")] public virtual ApplicationUser Manager { get; set; }
        private async Task<List<ApplicationUser>> FindManagers(IEnumerable<string> userIds)
        {
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            // Get unique manager IDs from ReportsToUserId
            var managerIds = users
                .Where(u => !string.IsNullOrEmpty(u.ReportsToUserId))
                .Select(u => u.ReportsToUserId)
                .Distinct()
                .ToList();

            if (!managerIds.Any())
            {
                _logger.LogInformation("No managers found for user IDs: {UserIds}", string.Join(", ", userIds));
                return new List<ApplicationUser>();
            }

            var managers = await _context.Users
                .Where(u => managerIds.Contains(u.Id))
                .ToListAsync();

            // Filter out any managers who are already receivers to prevent escalation loops
            managers = managers.Where(m => !userIds.Contains(m.Id)).ToList();

            return managers;
        }

        public async Task<List<EscalationReplyDto>> GetEscalationRepliesAsync(int escalationId)
        {
            _logger.LogInformation("Retrieving replies for escalation ID: {EscalationId}", escalationId);

            try
            {
                // First, verify the escalation exists
                var escalationExists = await _context.Escalations
                    .AnyAsync(e => e.Id == escalationId);

                if (!escalationExists)
                {
                    _logger.LogWarning("Escalation not found when retrieving replies. ID: {EscalationId}", escalationId);
                    return new List<EscalationReplyDto>();
                }

                var replies = await _context.EscalationReplies
                    .Include(r => r.Sender)
                    .Include(r => r.Receiver)
                    .Include(r => r.Escalation)
                    .Where(r => r.EscalationId == escalationId)
                    .OrderBy(r => r.TimeSent)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} replies for escalation ID: {EscalationId}", replies.Count, escalationId);

                return replies.Select(reply => new EscalationReplyDto
                {
                    EscalationId = reply.EscalationId,
                    Content = reply.Content ?? string.Empty,
                    SenderId = reply.SenderId ?? string.Empty,
                    ReceiverId = reply.ReceiverId ?? string.Empty,
                    TimeSent = reply.TimeSent,
                    SenderName = reply.Sender?.UserName ?? "Unknown User",
                    ReceiverName = reply.Receiver?.UserName ?? "Unknown User",
                    EscalationTitle = reply.Escalation?.Title ?? "Unknown Escalation"
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving replies for escalation ID: {EscalationId}", escalationId);
                throw;
            }
        }

        public async Task<List<EscalationReplyDto>> GetMyRepliesAsync(string userId)
        {
            _logger.LogInformation("Retrieving replies by user: {UserId}", userId);

            var replies = await _context.EscalationReplies
                .Include(r => r.Sender)
                .Include(r => r.Receiver)
                .Include(r => r.Escalation)
                .Where(r => r.SenderId == userId || r.ReceiverId == userId)
                .OrderByDescending(r => r.TimeSent) // Newest first
                .ToListAsync();

            // Load escalation titles if needed
            var escalationIds = replies.Select(r => r.EscalationId).Distinct().ToList();
            var escalations = await _context.Escalations
                .Where(e => escalationIds.Contains(e.Id))
                .ToDictionaryAsync(e => e.Id, e => e.Title);

            _logger.LogInformation("Found {Count} replies by user: {UserId}", replies.Count, userId);

            return replies.Select(reply => new EscalationReplyDto
            {
                EscalationId = reply.EscalationId,
                Content = reply.Content,
                SenderId = reply.SenderId,
                ReceiverId = reply.ReceiverId,
                TimeSent = reply.TimeSent,
                SenderName = reply.Sender?.UserName,
                ReceiverName = reply.Receiver?.UserName,
                EscalationTitle = escalations.ContainsKey(reply.EscalationId) ? escalations[reply.EscalationId] : "Unknown Escalation"
            }).ToList();
        }

        public async Task<List<EscalationDto>> GetEscalationsAsync(string senderId)
        {
            _logger.LogInformation("Retrieving sent escalations for sender: {SenderId}", senderId);

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => e.SenderId == senderId)
                .ToListAsync();

            _logger.LogInformation("Found {Count} escalations for sender: {SenderId}", escalations.Count, senderId);
            return escalations.Select(MapToEscalationDto).ToList();
        }

        public async Task<List<EscalationDto>> GetMyEscalationsAsync(string receiverId)
        {
            _logger.LogInformation("Retrieving escalations for receiver: {ReceiverId}", receiverId);

            var escalationUsers = await _context.EscalationUsers
                .Where(eu => eu.UserId == receiverId)
                .Select(eu => eu.EscalationId)
                .ToListAsync();

            var escalations = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.Sender)
                .Include(e => e.EscalationUsers)
                .Where(e => escalationUsers.Contains(e.Id))
                .ToListAsync();

            _logger.LogInformation("Found {Count} escalations for receiver: {ReceiverId}", escalations.Count, receiverId);
            return escalations.Select(MapToEscalationDto).ToList();
        }

        public async Task<bool> EditEscalationAsync(EditEscalationDto dto, string senderId)
        {
            _logger.LogInformation("Attempting to edit escalation. Escalation ID: {EscalationId}, Sender: {SenderId}",
                dto.Id, senderId);

            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            var escalation = await _context.Escalations
                .Include(e => e.Receiver)
                .Include(e => e.EscalationUsers)
                .FirstOrDefaultAsync(e => e.Id == dto.Id && e.SenderId == senderId);

            if (escalation == null)
            {
                _logger.LogWarning("Escalation not found or user not authorized. Escalation ID: {EscalationId}, Sender: {SenderId}",
                    dto.Id, senderId);
                return false;
            }

            try
            {
                escalation.Title = dto.Title ?? escalation.Title;
                escalation.Content = dto.Content ?? escalation.Content;
                escalation.Type = dto.Type ?? escalation.Type;
                escalation.ProjectId = dto.ProjectId;
                escalation.ProjectTaskId = dto.ProjectTaskId;
                escalation.IndependentTaskId = dto.IndependentTaskId;
                escalation.MilestoneId = dto.MilestoneId;
                escalation.AttachmentId = dto.AttachmentId != Guid.Empty ? dto.AttachmentId : escalation.AttachmentId;
                escalation.ResponseTimeLimit = dto.ResponseTimeLimit;
                // Note: EscalationLevel is not updated here as it s managed by the system during escalation

                if (dto.UserIds != null && dto.UserIds.Any())
                {
                    _logger.LogInformation("Updating recipients for escalation ID: {EscalationId}. New recipient count: {Count}",
                        dto.Id, dto.UserIds.Count);

                    var users = await _context.Users.Where(u => dto.UserIds.Contains(u.Id)).ToListAsync();
                    if (users.Count != dto.UserIds.Count)
                    {
                        _logger.LogWarning("One or more recipient user IDs not found. Expected: {ExpectedCount}, Found: {FoundCount}",
                            dto.UserIds.Count, users.Count);
                        throw new Exception("One or more recipient user IDs not found");
                    }

                    escalation.Receiver = users;

                    var existingEntries = await _context.EscalationUsers
                        .Where(eu => eu.EscalationId == escalation.Id)
                        .ToListAsync();

                    _context.EscalationUsers.RemoveRange(existingEntries);
                    _logger.LogInformation("Removed {Count} existing EscalationUser entries", existingEntries.Count);

                    foreach (var user in users)
                    {
                        _context.EscalationUsers.Add(new EscalationUser
                        {
                            EscalationId = escalation.Id,
                            UserId = user.Id,
                            IsRead = false
                        });
                    }
                    _logger.LogInformation("Added {Count} new EscalationUser entries", users.Count);
                }

                escalation.TimeEdited = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully edited escalation ID: {EscalationId}", dto.Id);
                return true;
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error while editing escalation ID: {EscalationId}", dto.Id);
                throw new Exception("Database error occurred while editing escalation", dbEx);
            }
        }

        public async Task<int> GetUnreadEscalationCountAsync(string userId)
        {
            var count = await _context.EscalationUsers
                .CountAsync(eu => eu.UserId == userId && !eu.IsRead);

            _logger.LogDebug("Unread escalation count for user {UserId}: {Count}", userId, count);
            return count;
        }

        public async Task<bool> MarkEscalationAsReadAsync(int escalationId, string userId)
        {
            _logger.LogInformation("Marking escalation as read. Escalation ID: {EscalationId}, User: {UserId}",
                escalationId, userId);

            var escalationUser = await _context.EscalationUsers
                .FirstOrDefaultAsync(eu => eu.EscalationId == escalationId && eu.UserId == userId);

            if (escalationUser == null)
            {
                _logger.LogWarning("EscalationUser entry not found. Escalation ID: {EscalationId}, User: {UserId}",
                    escalationId, userId);
                return false;
            }

            escalationUser.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully marked escalation as read. Escalation ID: {EscalationId}, User: {UserId}",
                escalationId, userId);
            return true;
        }

        private EscalationDto MapToEscalationDto(Escalation escalation)
        {
            _logger.LogDebug("Mapping escalation to DTO. Escalation ID: {EscalationId}", escalation.Id);

            return new EscalationDto
            {
                Id = escalation.Id,
                Title = escalation.Title ?? string.Empty,
                Type = escalation.Type,
                ProjectId = escalation.ProjectId,
                ProjectTaskId = escalation.ProjectTaskId,
                IndependentTaskId = escalation.IndependentTaskId,
                MilestoneId = escalation.MilestoneId,
                Content = escalation.Content,
                TimeSent = escalation.TimeSent,
                TimeEdited = escalation.TimeEdited,
                UserIds = escalation.Receiver?.Select(u => u.Id).ToList() ?? new List<string>(),
                AttachmentId = escalation.AttachmentId ?? Guid.Empty,
                SenderId = escalation.SenderId,
                Status = escalation.Status,
                EscalationLevel = escalation.EscalationLevel
            };
        }
    }
}