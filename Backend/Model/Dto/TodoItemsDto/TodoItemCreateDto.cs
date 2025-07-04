using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.TodoItemsDto
{
    public class TodoItemCreateDto
    {
        [Required]
        public int ProjectTaskId { get; set; }

        [Required, MaxLength(250)]
        public string Title { get; set; }

        [Required]
        public string AssignedById { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required, Range(0, 100)]
        public int Weight { get; set; }

    }
}
