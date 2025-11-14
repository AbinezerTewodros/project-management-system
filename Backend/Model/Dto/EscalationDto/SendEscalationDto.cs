using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Model.Dto.EscalationDto
{
    public class SendEscalationDto
    {
        public string Title { get; set; }
        public string Type { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }
        public int? IndependentTaskId { get; set; }
        public int? MilestoneId { get; set; }
        public string Content { get; set; }
        public List<string> UserIds { get; set; }
        public Guid AttachmentId { get; set; }
        public DateTime ResponseTimeLimit { get; set; }
        public EscalationStatus Status { get; set; } = EscalationStatus.Active;

        // Added EscalationLevel to allow specifying the level when creating escalations
        public int EscalationLevel { get; set; } = 0; // Default to 0 for new escalations
        public bool IsRead { get; set; } = false;
    }
}