using ProjectManagementSystem1.Model.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public Guid EntityId { get; set; } // Foreign Key to the associated entity

    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } // Type of the associated entity

    public int? ProjectTaskId { get; set; }
    [ForeignKey("ProjectTaskId")]
    public ProjectTask? ProjectTask { get; set; }

    public int ProjectId { get; set; }
    [ForeignKey("ProjectId")]
    public Project? Project { get; set; }
}

public enum AttachmentCategory
{
    Chat,
    Attachment,
    DDL,
    Profile,
    Task,
    Project,
    // Add other categories as needed
}

public enum AccessibilityLevel
{
    Public,
    Private,
    Protected,
    Internal,
    // Add other levels as needed
}
