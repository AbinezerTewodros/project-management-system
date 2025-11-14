using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.IndependentTaskDto
{
    public class IndependentTaskUpdateDto
    {
        [Required]
        public int TaskId { get; set; }

        [MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        public IndependentTaskStatus? Status { get; set; }

        [Range(0, 100)]
        public double? Progress { get; set; }

        [Range(0, 100)]
        public int? Weight { get; set; }

        public string? AssignedToUserId { get; set; }
    }
}