using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.TodoItemsDto
{
    public class TodoItemUpdateDto
    {
        [MaxLength(250)]
        public string? Title { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(0, 100)]
        public int? Weight { get; set; }

        [Range(0, 100)]
        public double? Progress { get; set; }
    }
}
