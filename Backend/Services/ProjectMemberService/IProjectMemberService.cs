namespace ProjectManagementSystem1.Services.ResourceAcessService
{
    public interface IProjectMemberService
    {
        Task<bool> IsMemberAsync(string entityType, string entityId, string userId);
    }

}
