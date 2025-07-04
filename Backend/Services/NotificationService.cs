using Microsoft.EntityFrameworkCore;
using MimeKit;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace ProjectManagementSystem1.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        // Add any other dependencies you might need, e.g., for sending emails
        private readonly ILogger<NotificationService> _logger; // Inject logger
        private readonly IConfiguration _configuration;
        public NotificationService(AppDbContext context, ILogger<NotificationService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task CreateNotificationAsync(string recipientUserId, string subject, string message, string relatedEntityType, int relatedEntityId, NotificationDeliveryMethod deliveryMethod, DateTime? scheduledSendTime = null)
        {
            var notification = new Notification
            {
                RecipientUserId = recipientUserId,
                Subject = subject,
                Message = message,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                DeliveryMethod = deliveryMethod,
                ScheduledSendTime = scheduledSendTime
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<Notification> GetNotificationByIdAsync(int id)
        {
            return await _context.Notifications.FindAsync(id);
        }

        public async Task<IEnumerable<Notification>> GetNotificationsForUserAsync(string userId)
        {
            return await _context.Notifications
                .Where(n => n.RecipientUserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task SendNotificationAsync(Notification notification)
        {
            if (notification.Status != NotificationStatus.Pending)
            {
                return; // Don't resend if already sent or failed
            }

            try
            {
                notification.Status = NotificationStatus.Sent;
                notification.SentAt = DateTime.UtcNow;

                switch (notification.DeliveryMethod)
                {
                    case NotificationDeliveryMethod.Email:
                        try
                        {
                            var email = new MimeMessage();
                            email.From.Add(MailboxAddress.Parse(_configuration["Smtp:SenderEmail"])); // Configure sender email in appsettings
                            email.To.Add(MailboxAddress.Parse(notification.RecipientUserId));
                            email.Subject = notification.Subject;
                            email.Body = new TextPart("html") { Text = notification.Message }; // Or TextPart for plain text

                            using (var smtpClient = new SmtpClient())
                            {
                                smtpClient.Connect(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]), bool.Parse(_configuration["Smtp:UseSsl"]));
                                smtpClient.Authenticate(_configuration["Smtp:Username"], _configuration["Smtp:Password"]);
                                await smtpClient.SendAsync(email);
                                await smtpClient.DisconnectAsync(true);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"Error sending email notification {notification.Id}: {ex.Message}");
                            notification.Status = NotificationStatus.Failed;
                            notification.FailureReason = ex.Message;
                        }
                        break;
                    case NotificationDeliveryMethod.InApp:
                        // In-app notifications are often handled on the client-side by querying for notifications with Status 'Pending' or a specific 'Ready' status
                        _logger.LogInformation($"In-app notification created for user {notification.RecipientUserId} with subject '{notification.Subject}'");
                        break;
                    default:
                        _logger.LogWarning($"Unsupported delivery method: {notification.DeliveryMethod}");
                        notification.Status = NotificationStatus.Failed;
                        notification.FailureReason = "Unsupported delivery method";
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending notification {notification.Id}: {ex.Message}");
                notification.Status = NotificationStatus.Failed;
                notification.FailureReason = ex.Message;
            }
            finally
            {
                _context.Notifications.Update(notification);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ProcessPendingRemindersAsync()
        {
            var now = DateTime.UtcNow;
            var pendingReminders = await _context.Notifications
                .Where(n => n.Status == NotificationStatus.Pending &&
                            n.ScheduledSendTime.HasValue &&
                            n.ScheduledSendTime <= now)
                .ToListAsync();

            foreach (var reminder in pendingReminders)
            {
                await SendNotificationAsync(reminder);
            }
        }
    }
}