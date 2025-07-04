using ProjectManagementSystem1.Model.Entities;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(string userId, string entityType, int entityId, string actionType, string details = null);
    }
}