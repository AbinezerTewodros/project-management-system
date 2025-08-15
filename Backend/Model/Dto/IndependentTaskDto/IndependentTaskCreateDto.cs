using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.IndependentTaskDto
{
    public class IndependentTaskCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public IndependentTaskStatus Status { get; set; } = IndependentTaskStatus.Pending;// Use enum

        [Range(1, 100)]
        public int Weight { get; set; } = 0;
        public IndependentTaskPriority Priority { get; set; } = IndependentTaskPriority.Medium;

        [Range(0, 100)]
        public double Progress { get; set; }

        [Required]
        public string AssignedToUserId { get; set; }
    }
}