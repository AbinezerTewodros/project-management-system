namespace ProjectManagementSystem1.Services.FileStorageService
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly ILogger<LocalFileStorageService> _logger;

        public LocalFileStorageService(IConfiguration config, ILogger<LocalFileStorageService> logger)
        {
            _basePath = config["AttachmentSettings:StoragePath"];
            _logger = logger;

            if (!Directory.Exists(_basePath))
                Directory.CreateDirectory(_basePath);
        }
        public async Task<string> StoreAsync(Stream fileStream, string fileName)
        {
            var safeFileName = Path.GetInvalidFileNameChars()
                .Aggregate(fileName, (current, c) => current.Replace(c, '_'));

            var filePath = Path.Combine(_basePath, $"{Guid.NewGuid()}-{safeFileName}");

            await using var output = new FileStream(filePath, FileMode.Create);
            await fileStream.CopyToAsync(output);

            return filePath;
        }

        public Task<byte[]> RetrieveAsync(string filePath) =>
            File.ReadAllBytesAsync(filePath);

        public Task DeleteAsync(string filePath)
        {
            if (File.Exists(filePath)) File.Delete(filePath);
            return Task.CompletedTask;
        }
    }

}
