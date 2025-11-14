using System;
using System.ComponentModel.DataAnnotations;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Dto.MilestoneDto
{
    public class CreateMilestoneDto
    {
        [Required]
        public string MilestoneName { get; set; }
        public string Description { get; set; }
        public string AssignedMemberId { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime DueDate { get; set; }
        [Range(0, 100)]
        public int Weight { get; set; } = 100; // Default value
        public MilestoneStatus Status { get; set; } = MilestoneStatus.Pending; // Default value
    }
}