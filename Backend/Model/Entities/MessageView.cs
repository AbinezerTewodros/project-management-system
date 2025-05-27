using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Model.Entities
{
    public class MessageView
    {
        [Key]
        public long ViewId { get; set; }

        public long MessageId { get; set; } // FK handled in OnModelCreating
        public long ViewerId { get; set; }

        public DateTime SeenTimestamp { get; set; }
        public string ViewerIp { get; set; }
        public string UserAgent { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
