namespace ProjectManagementSystem1.Models.Enums
{
    public enum RequestType
    {
        NewDevelopment,
        Enhancement,
        InternalIntegration,
        ThirdPartyIntegration
    }

    public enum RequestCategory
    {
        Remittance,
        Government,
        InhouseDevelopment
    }

    public enum ServiceCategory
    {
        DigitalBankingManagement,
        CardBankingManagement,
        CreditManagement,
        RiskManagement
    }

    public enum ProductCategory
    {
        MobileBanking,
        CBEBirrWallet,
        T24CoreBanking,
        IMALCoreBanking,
        OtherLegacySystem
    }

    public enum PriorityLevel
    {
        P1, P2, P3, P4, P5
    }

    public enum ImpactUrgencyLevel
    {
        Low, Medium, High
    }

    public enum RequestStatus
    {
        Submitted,
        UnderEvaluation,
        Approved,
        Rejected,
        Backlogged,
        InProgress,
        Completed,
        Delivered,
        Closed
    }

    public enum WorkflowStage
    {
        InitialEvaluation,
        IdeaRefinement,
        SprintPlanning,
        UAT,
        Deployment,
        Handover
    }

    public enum FileType
    {
        Word,
        Excel,
        PowerPoint,
        PDF,
        JPEG,
        JPG,
        Other
    }

    public enum AttachmentCategory
    {
        BusinessCase,
        CostEstimates,
        BusinessRequirementDocument,
        BusinessFeasibilityReport,
        TechnicalFeasibilityReport,
        UATTestReport,
        INSASecurityCertificate,
        SecurityClearance,
        RequestMemo,
        ResourceAssignmentMemo
    }
}