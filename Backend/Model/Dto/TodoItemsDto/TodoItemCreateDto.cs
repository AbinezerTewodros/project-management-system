using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.TodoItemsDto
{
    public class TodoItemCreateDto
    {
        [Required(ErrorMessage = "Project task ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Project task ID must be a positive number")]
        public int ProjectTaskId { get; set; }

        [Required(ErrorMessage = "Todo item title is required")]
        [StringLength(250, MinimumLength = 3, ErrorMessage = "Todo item title must be between 3 and 250 characters")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Assigned by ID is required")]
        [StringLength(450, ErrorMessage = "Assigned by ID cannot exceed 450 characters")]
        public string AssignedById { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Weight is required")]
        [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100")]
        public int Weight { get; set; }
    }
}
