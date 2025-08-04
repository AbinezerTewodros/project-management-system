using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

public class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid(); // Primary Key

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; }

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } // MIME type of the file

    [Required]
    public AttachmentCategory Category { get; set; } // Category of the attachment

    public long FileSize { get; set; } // Size of the file in bytes

    [Required]
    public string FilePhysicalPath { get; set; } // Absolute or relative path to the file

    //[Column(TypeName = "jsonb")] // For PostgreSQL
    //public string MetadataJson { get; set; }

    //[NotMapped]
    //public Dictionary<string, string> Metadata
    //{
    //    get => JsonSerializer.Deserialize<Dictionary<string, string>>(MetadataJson ?? "{}");
    //    set => MetadataJson = JsonSerializer.Serialize(value);
    //}

    // ... other properties ...
    public List<AttachmentMetadata> Metadata { get; set; } = new();


    public string UploadedByUserId { get; set; } // Foreign Key referencing the user

    [ForeignKey("UploadedByUserId")]
    public ApplicationUser UploadedBy { get; set; } // Navigation property to the User

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public AccessibilityLevel Accessibility { get; set; } = AccessibilityLevel.Private; // Accessibility level

    [MaxLength(64)]
    public string Checksum { get; set; } // Hash of the file content

    public bool IsDeleted { get; set; } = false;

    public int Version { get; set; } = 1; // Optional: For tracking file revisions

    public string EntityId { get; set; } // Foreign Key to the associated entity

    
    [MaxLength(100)]
    public string EntityType { get; set; } // Type of the associated entity
    public byte[]? Thumbnail { get; set; } // Stores compressed thumbnail
    public string? ThumbnailContentType { get; set; }

    public int? ProjectTaskId { get; set; }
    [ForeignKey("ProjectTaskId")]
    public ProjectTask? ProjectTask { get; set; }
}

//public enum AttachmentCategory
//{
//    Chat,
//    Attachment,
//    DDL,
//    Profile,
//    Task,
//    Project,
//    // Add other categories as needed
//}

public enum AttachmentCategory
{
    [Display(Name = "Project Documents")]
    Project,

    [Display(Name = "Task Attachments")]
    Task,

    [Display(Name = "Deliverables")]
    Deliverable,

    [Display(Name = "Team Communications")]
    Communication,

    [Display(Name = "Financial Records")]
    Financial,

    [Display(Name = "Risk Materials")]
    Risk,

    [Display(Name = "Compliance Docs")]
    Compliance
}

public enum AccessibilityLevel
{
    Public,
    Private,
    Protected,
    Internal,
    // Add other levels as needed
}

//[Owned]
public class AttachmentMetadata
{

    [MaxLength(100)]
    public string Key { get; set; }

    [MaxLength(100)]
    public string Value { get; set; }
}

