using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectMangementSystem1.Services
{
public interface IAttachmentService
{
    Task<AttachmentDto> UploadAsync(IFormFile file, long uploadedBy);
    Task<FileStreamResult> DownloadAsync(long id);
    Task<bool> SoftDeleteAsync(long id, long userId);
}
}
