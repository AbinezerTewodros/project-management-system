using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services
{
    public interface INotificationService
    {

        Task CreateNotificationAsync(string userId, string message, string? relatedEntityType, int? relatedEntityId);
        Task<List<Notification>> GetNotificationsForUserAsync(string userId);
        Task MarkNotificationAsReadAsync(int notificationId);
    }
}
