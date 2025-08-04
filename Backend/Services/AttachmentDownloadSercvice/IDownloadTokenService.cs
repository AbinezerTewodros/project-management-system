namespace ProjectManagementSystem1.Services.AttachmentDownloadSercvice
{
    public interface IDownloadTokenService
    {
        string GenerateToken(Guid attachmentId, TimeSpan expiry);
        bool ValidateToken(string token, Guid attachmentId);

    }
 
}
