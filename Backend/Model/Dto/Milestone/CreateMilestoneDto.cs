using System;
using System.ComponentModel.DataAnnotations;
using static ProjectManagementSystem1.Model.Entities.Milestone;

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
        public DateTime? StartDate { get; set; } // Optional
        public DateTime? DueDate { get; set; }
        [Range(0, 100)]
        public int Weight { get; set; } = 100; // Default value
        public MilestoneStatus Status { get; set; } // Default value
    }
}