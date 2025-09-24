using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.TodoItemsDto
{
    public class TodoItemReadDto
    {
        public int Id { get; set; }
        public int ProjectTaskId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public int Weight { get; set; }
        public double Progress { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public TodoItemStatus Status { get; set; }
    }
}
