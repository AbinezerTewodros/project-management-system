using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.Erp;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ErpUserService
{

    public class ErpUserService : IErpUserService
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;

        public ErpUserService(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config, IWebHostEnvironment env)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _config = config;
            _env = env;
        }

        public async Task<ErpUserDto> SyncSingleUserAsync(string employeeId)
        {
            if (_config.GetValue<bool>("ErpApi:UseMockErp"))
            {
                // ✅ Read from JSON file
                var filePath = Path.Combine(_env.ContentRootPath, "erpUsers.json");
                var json = await File.ReadAllTextAsync(filePath);
                var users = JsonConvert.DeserializeObject<List<ErpUserDto>>(json);

                var userDto = users?.FirstOrDefault(u => u.EmployeeId == employeeId);
                if (userDto == null)
                    throw new Exception($"User {employeeId} not found in mock ERP.");

                await UpsertUserAsync(userDto);
                return userDto;
            }
            else
            {
                // ✅ Call real ERP API
                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = $"{_config["ErpApi:BaseUrl"]}/api/users/{employeeId}";
                var response = await httpClient.GetAsync(apiUrl);

                if (!response.IsSuccessStatusCode)
                    throw new Exception("Failed to fetch user from ERP.");

                var userDto = await response.Content.ReadFromJsonAsync<ErpUserDto>();
                if (userDto == null) throw new Exception("ERP returned null data.");

                await UpsertUserAsync(userDto);
                return userDto;
            }
        }

        public async Task<List<ErpUserDto>> SyncMultipleUsersAsync(List<string> employeeIds)
        {
            var results = new List<ErpUserDto>();

            foreach (var id in employeeIds)
            {
                try
                {
                    var user = await SyncSingleUserAsync(id);
                    results.Add(user);
                }
                catch
                {
                    // log and skip errors
                }
            }

            return results;
        }

        private async Task UpsertUserAsync(ErpUserDto userDto)
        {
            var existing = await _context.ErpUsers.FirstOrDefaultAsync(u => u.EmployeeId == userDto.EmployeeId);
            if (existing != null)
            {
                existing.FullName = userDto.FullName;
                existing.Department = userDto.Department;
                existing.JobTitle = userDto.JobTitle;
                existing.Company = userDto.Company;
                existing.Email = userDto.Email;
                existing.PhoneNumber = userDto.PhoneNumber;
                existing.UpdatedDate = DateTime.UtcNow;
            }
            else
            {
                var newUser = new ErpUser
                {
                    EmployeeId = userDto.EmployeeId,
                    FullName = userDto.FullName,
                    Department = userDto.Department,
                    JobTitle = userDto.JobTitle,
                    Company = userDto.Company,
                    Email = userDto.Email,
                    PhoneNumber = userDto.PhoneNumber,
                    CreatedDate = DateTime.UtcNow
                };
                _context.ErpUsers.Add(newUser);
            }

            await _context.SaveChangesAsync();
        }
    }

    //public class ErpUserService : IErpUserService
    //{
    //    private readonly AppDbContext _context;
    //    private readonly IHttpClientFactory _httpClientFactory;
    //    private readonly IConfiguration _config;

    //    public ErpUserService(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config)
    //    {
    //        _context = context;
    //        _httpClientFactory = httpClientFactory;
    //        _config = config;
    //    }

    //    public async Task<ErpUserDto> SyncSingleUserAsync(string employeeId)
    //    {
    //        var httpClient = _httpClientFactory.CreateClient();
    //        var apiUrl = $"{_config["ErpApi:BaseUrl"]}/api/users/{employeeId}";
    //        var response = await httpClient.GetAsync(apiUrl);

    //        if (!response.IsSuccessStatusCode)
    //            throw new Exception("Failed to fetch user from ERP.");

    //        var userDto = await response.Content.ReadFromJsonAsync<ErpUserDto>();
    //        if (userDto == null) throw new Exception("ERP returned null data.");

    //        var existing = await _context.ErpUsers.FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
    //        if (existing != null)
    //        {
    //            // Update
    //            existing.FullName = userDto.FullName;
    //            existing.Department = userDto.Department;
    //            existing.JobTitle = userDto.JobTitle;
    //            existing.Company = userDto.Company;
    //            existing.Email = userDto.Email;
    //            existing.PhoneNumber = userDto.PhoneNumber;
    //            existing.UpdatedDate = DateTime.UtcNow;
    //        }
    //        else
    //        {
    //            var newUser = new ErpUser
    //            {
    //                EmployeeId = userDto.EmployeeId,
    //                FullName = userDto.FullName,
    //                Department = userDto.Department,
    //                JobTitle = userDto.JobTitle,
    //                Company = userDto.Company,
    //                Email = userDto.Email,
    //                PhoneNumber = userDto.PhoneNumber,
    //                CreatedDate = DateTime.UtcNow
    //            };
    //            _context.ErpUsers.Add(newUser);
    //        }

    //        await _context.SaveChangesAsync();
    //        return userDto;
    //    }

    //    public async Task<List<ErpUserDto>> SyncMultipleUsersAsync(List<string> employeeIds)
    //    {
    //        var results = new List<ErpUserDto>();

    //        foreach (var id in employeeIds)
    //        {
    //            try
    //            {
    //                var user = await SyncSingleUserAsync(id);
    //                results.Add(user);
    //            }
    //            catch
    //            {
    //                // Log and skip invalid ERP users
    //            }
    //        }

    //        return results;
    //    }
    //}

}
