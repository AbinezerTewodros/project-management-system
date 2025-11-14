using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.TodoItemsDto
{
    public class TodoItemUpdateDto
    {
        [StringLength(250, MinimumLength = 3, ErrorMessage = "Todo item title must be between 3 and 250 characters")]
        public string? Title { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100")]
        public int? Weight { get; set; }

        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
        public double? Progress { get; set; }

        [Required(ErrorMessage = "Assignee ID is required")]
        [StringLength(450, ErrorMessage = "Assignee ID cannot exceed 450 characters")]
        public string AssigneeId { get; set; }
    }
}
