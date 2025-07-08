using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.NotificationService;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetNotificationsForUserAsync(userId);
            return Ok(notifications);
        }

        [HttpPut("mark-as-read/{id}")]
        public async Task<IActionResult> MarkNotificationAsRead(int id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (notification.RecipientUserId != userId)
            {
                return Forbid(); // Or Unauthorized
            }

            // Update the status to something like 'Read' (you might need to add a new status to the enum)
            // For simplicity, we can just mark it as sent so it's no longer pending
            notification.Status = NotificationStatus.Sent;
            await _notificationService.SendNotificationAsync(notification); // Or create a specific MarkAsRead method

            return Ok();
        }

        [HttpPut("mark-all-as-read")]
        public async Task<IActionResult> MarkAllUserNotificationsAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetNotificationsForUserAsync(userId);
            foreach (var notification in notifications)
            {
                if (notification.Status == NotificationStatus.Pending)
                {
                    notification.Status = NotificationStatus.Sent;
                    await _notificationService.SendNotificationAsync(notification); // Or a specific MarkAsRead method
                }
            }

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (notification.RecipientUserId != userId)
    {
                return Forbid(); // Or Unauthorized
            }

            // You would typically add logic to actually delete the notification from the database here
            // For now, we can just mark it as failed or a new status like 'Deleted'
            notification.Status = NotificationStatus.Failed; // Or a new status
            notification.FailureReason = "Deleted by user";
            await _notificationService.SendNotificationAsync(notification); // Or a specific Delete method

            return NoContent();
        }
    }
}