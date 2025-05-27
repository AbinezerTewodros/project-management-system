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
    public class Attachment
    {
        [Key]
        public long AttachmentId { get; set; }

        public string FileName { get; set; }
        public string MimeType { get; set; }
        public long FileSizeBytes { get; set; }
        public string StoragePath { get; set; }

        public string Checksum { get; set; }
        public long UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;
    }

}
