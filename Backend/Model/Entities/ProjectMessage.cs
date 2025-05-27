using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Entities
{
    public class ProjectMessage
    {
        [Key]
        public long MessageId { get; set; }

        public long ProjectId { get; set; }

        [Required]
        public string Content { get; set; }

        public long SenderId { get; set; }
        public string SenderName { get; set; }

        public long ReceiverId { get; set; }
        public string ReceiverName { get; set; }

        public int? SenderDepartmentId { get; set; }
        public int? ReceiverDepartmentId { get; set; }

        public DateTime TimeSent { get; set; }
        public DateTime? DeliveryTimeSeen { get; set; }
        public DateTime? TimeEdited { get; set; }

        public bool IsCurrentEmployee { get; set; } = true;

        public long? AttachmentId { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;

        public Attachment Attachment { get; set; }
        public ICollection<MessageView> Views { get; set; }
    }

}
