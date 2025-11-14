namespace ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto
{
    public class UserProjectDto
    {
        // Assignment identification (CRITICAL: Needed for approve/reject)
        public int AssignmentId { get; set; }  // ← ADDED: Unique identifier for the assignment
        
        // Project information
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string Priority { get; set; }
        public DateTime DueDate { get; set; }
        public string ProjectStatus { get; set; }  // ✅ RENAMED: Project's status (Active/Pending Approval/Rejected)
        
        // Assignment details
        public string MemberRole { get; set; }
        public double MemberProgress { get; set; }
        public string AssignmentStatus { get; set; }  // ✅ NEW: Assignment status (Pending/Approved/Rejected)
        
        // User information (for "Assigned To" column)
        public string? MemberFullName { get; set; }  // ← ADDED
        public string? MemberEmail { get; set; }     // ← ADDED
        
        // Audit information (for "Assigned By" column)
        public string? CreateUser { get; set; }      // ← ADDED
        public DateTime CreatedDate { get; set; }    // ← ADDED
        
        // Backward compatibility (deprecated - use ProjectStatus instead)
        public string Status => ProjectStatus;  // ✅ For backward compatibility
    }

}
