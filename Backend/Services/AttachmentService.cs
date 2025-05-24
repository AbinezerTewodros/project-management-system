namespace ProjectManagementSystem1.Services
{
public class AttachmentService : IAttachmentService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IMapper _mapper;

    public AttachmentService(AppDbContext context, IWebHostEnvironment env, IMapper mapper)
    {
        _context = context;
        _env = env;
        _mapper = mapper;
    }

    public async Task<AttachmentDto> UploadAsync(IFormFile file, long uploadedBy)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Invalid file.");

        var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
        var path = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(path);
        var fullPath = Path.Combine(path, fileName);

        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        var attachment = new Attachment
        {
            FileName = file.FileName,
            MimeType = file.ContentType,
            FileSizeBytes = file.Length,
            StoragePath = $"uploads/{fileName}",
            UploadedBy = uploadedBy,
            UploadedAt = DateTime.UtcNow
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        return _mapper.Map<AttachmentDto>(attachment);
    }

    public async Task<FileStreamResult> DownloadAsync(long id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment == null || attachment.IsDeleted)
            throw new FileNotFoundException("Attachment not found.");

        var fullPath = Path.Combine(_env.WebRootPath ?? "wwwroot", attachment.StoragePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("File missing from disk.");

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return new FileStreamResult(stream, attachment.MimeType)
        {
            FileDownloadName = attachment.FileName
        };
    }

    public async Task<bool> SoftDeleteAsync(long id, long userId)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment == null || attachment.UploadedBy != userId)
            return false;

        attachment.IsDeleted = true;
        attachment.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
}
