namespace ProjectManagementSystem1.Model.Entities
{
    public enum ProjectApprovalStatus
    {
        Pending,        // Project created, waiting for approval
        Approved,       // Project approved by manager
        Rejected,       // Project rejected by manager
        AutoApproved    // Project auto-approved (created by manager or admin)
    }
}
