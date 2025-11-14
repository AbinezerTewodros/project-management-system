using ProjectManagementSystem1.Model.Entities;
using System;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Model.Dto.EscalationDto
{
    public class EscalationDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Type { get; set; }
        public int? ProjectId { get; set; }
        public int? ProjectTaskId { get; set; }
        public int? IndependentTaskId { get; set; }
        public int? MilestoneId { get; set; }
        public string Content { get; set; }
        public List<string> UserIds { get; set; }
        public Guid AttachmentId { get; set; }
        public DateTime TimeSent { get; set; } = DateTime.UtcNow;
        public DateTime? TimeEdited { get; set; }
        public string SenderId { get; set; }
        public EscalationStatus Status { get; set; } = EscalationStatus.Active;
        public int? ParentEscalationId { get; set; }

        // Added EscalationLevel to reflect the hierarchy level of the escalation
        public int EscalationLevel { get; set; }
        public bool IsRead { get; set; } = false;
        public List<EscalationReplyDto> Replies { get; set; } = new List<EscalationReplyDto>();
    }
}