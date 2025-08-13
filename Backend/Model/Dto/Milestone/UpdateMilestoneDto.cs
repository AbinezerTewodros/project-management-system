using System;
using System.ComponentModel.DataAnnotations;
using static ProjectManagementSystem1.Model.Entities.Milestone;

namespace ProjectManagementSystem1.Model.Dto.ProjectManagementDto
{
    public class UpdateMilestoneDto
    {
        [Required(ErrorMessage = "Milestone ID is required.")]
        public int MilestoneId { get; set; }

        [Required(ErrorMessage = "Milestone Name is required.")]
        public string MilestoneName { get; set; }

        public string Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100.")]
        public int Weight { get; set; } // Make nullable for optional updates

        public MilestoneStatus Status { get; set; }
        public string AssignedMemberId { get; set; } // Optional assignment update

        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100.")]
        public int Progress { get; set; } // Make nullable for optional updates
    }
}