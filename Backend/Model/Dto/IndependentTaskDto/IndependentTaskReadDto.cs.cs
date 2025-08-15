using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Dto.IndependentTaskDto
{
    public class IndependentTaskReadDto
    {
        public int TaskId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime DueDate { get; set; }
        public IndependentTaskStatus Status { get; set; }
        public double Progress { get; set; }
        public int Weight { get; set; }
        public string CreatedByUserId { get; set; }
        public string AssignedToUserId { get; set; }
    }
}