using System;
using ProjectManagementSystem1.Model.Entities;

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
        
        // Assignment Approval Fields
        public MilestoneAssignmentStatus AssignmentStatus { get; set; }
        public DateTime? AssignmentAcceptedDate { get; set; }
        public string? AssignmentRejectionReason { get; set; }
    }
}