namespace ProjectManagementSystem1.Services.Validation
{
    public interface IEntityValidator
    {
        Task<bool> ExistsAsync(string entityType, string entityId);
    }
}
