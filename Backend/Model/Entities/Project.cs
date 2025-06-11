using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Project
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string ProjectName { get; set; }
    public string Department {  get; set; } // assigned when project is created (logged-in manager department)

    public string ProjectOwner { get; set; }

    [Phone]
    public string ProjectOwnerPhone { get; set; }

    [EmailAddress]
    public string ProjectOwnerEmail { get; set; }

    public string Priority { get; set; } 
    public DateTime? DueDate { get; set; }

    public string Status { get; set; }

    // Audit fields
    public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedDate { get; set; }
    public string? CreateUser { get; set; }
    public string? UpdateUser { get; set; }

    [Timestamp]
    public byte[] Version { get; set; }
}
