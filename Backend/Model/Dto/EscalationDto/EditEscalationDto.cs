using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Model.Dto.EscalationDto
{
    public class EditEscalationDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Type { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }
        public int? IndependentTaskId { get; set; }
        public int? MilestoneId { get; set; }
        public string Content { get; set; }
        public Guid AttachmentId { get; set; }
        public List<string> UserIds { get; set; } = new List<string>();
        public DateTime ResponseTimeLimit { get; set; }

        // Added EscalationLevel for consistency, though typically not user-editable
        public int EscalationLevel { get; set; } = 0; // Default to 0
    }
}