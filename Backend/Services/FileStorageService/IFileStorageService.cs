namespace ProjectManagementSystem1.Services.FileStorageService
{
    public interface IFileStorageService
    {
        Task<string> StoreAsync(Stream fileStream, string fileName);
        Task<byte[]> RetrieveAsync(string filePath);
        Task DeleteAsync(string filePath);
        string GetStoragePath();
    }

}
