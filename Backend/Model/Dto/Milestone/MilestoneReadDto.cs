using System;
using static ProjectManagementSystem1.Model.Entities.Milestone;

namespace ProjectManagementSystem1.Model.Dto.MilestoneDto
{
    public class MilestoneReadDto
    {
        public int MilestoneId { get; set; }
        public string MilestoneName { get; set; }
        public string Description { get; set; }
        public string AssignedMemberId { get; set; }
        public DateTime? DueDate { get; set; }
        public int Weight { get; set; }
        public MilestoneStatus Status { get; set; }
        public int ProjectId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public double Progress { get; set; }
    }
}