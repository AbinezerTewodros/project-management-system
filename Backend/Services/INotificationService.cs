using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string recipientUserId, string subject, string message, string relatedEntityType, int relatedEntityId, NotificationDeliveryMethod deliveryMethod, DateTime? scheduledSendTime = null);
        Task<Notification> GetNotificationByIdAsync(int id);
        Task<IEnumerable<Notification>> GetNotificationsForUserAsync(string userId);
        Task SendNotificationAsync(Notification notification);
        Task ProcessPendingRemindersAsync(); // Method to be called by a scheduled task
    }
}