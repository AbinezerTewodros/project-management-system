using ProjectManagementSystem1.Model.Dto.IndependentTaskDto;
using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Drawing;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services
{
    public interface IIndependentTaskService
    {
        Task<IndependentTask> GetIndependentTaskByIdAsync(int id);
        Task<IEnumerable<IndependentTask>> GetAllIndependentTasksAsync();
        Task<IEnumerable<IndependentTask>> GetIndependentTasksByUserAsync(string userId);
        Task<IndependentTask> CreateIndependentTaskAsync(IndependentTaskCreateDto createDto, String CreatorId);
        Task<IndependentTask> UpdateIndependentTaskAsync(int id, IndependentTaskUpdateDto updateDto, string userId);
        Task AcceptTaskAssignmentAsync(int taskId, string userId);
        Task RejectTaskAssignmentAsync(int taskId, string userId, string reason);
        Task UpdateTaskProgressAsync(int taskId, string userId, int progress, string comments);
        Task CompleteTaskAsync(int taskId, string userId, string completionDetails);
        Task ApproveTaskCompletionAsync(int taskId, string approverId, string comments);
        Task RejectTaskCompletionAsync(int taskId, string rejectorId, string reason);
        //Task<Attachment> AddAttachmentAsync(int taskId, IFormFile file, string uploadedByUserId, string category = null);
        Task<IEnumerable<Attachment>> GetAttachmentsAsync(int taskId);
        //Task AddStatusHistory(IndependentTask task, IndependentTaskStatus oldStatus, string userId, string reason);

        Task<bool> DeleteIndependentTaskAsync(int id);
    }
}