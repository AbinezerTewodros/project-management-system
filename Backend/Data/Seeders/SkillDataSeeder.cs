using System.Text.Json.Serialization;
using System.Text.Json;
using ProjectManagementSystem1.Model.Entities;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Services.AddSkillService;

namespace ProjectManagementSystem1.Data.Seeders
{
    public class SkillDataSeeder
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SkillDataSeeder> _logger;
        private readonly ISkillService _skillService;

        public SkillDataSeeder(AppDbContext context,
                             IHttpClientFactory httpClientFactory,
                             ILogger<SkillDataSeeder> logger,
                             ISkillService skillService)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _skillService = skillService;
        }

        public async Task SeedAsync()
        {
            if (await _context.AddSkills.AnyAsync()) return;

            try
            {
                _logger.LogInformation("Starting skill seeding from ESCO API...");
                var skills = await _skillService.LoadSkillsFromEscoApi(limit: 500); // Load first 500 skills
                
                if (skills.Any())
                {
                    await _context.AddSkills.AddRangeAsync(skills);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully seeded {skills.Count} skills from ESCO API");
                }
                else
                {
                    _logger.LogWarning("No skills loaded from ESCO API. Seeding with default skills instead.");
                    await SeedDefaultSkills();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed skills from ESCO API. Seeding with default skills instead.");
                await SeedDefaultSkills();
            }
        }

        private async Task SeedDefaultSkills()
        {
            var defaultSkills = new List<AddSkill>
            {
                new AddSkill { Name = "C#", NormalizedName = "c#", Description = "Microsoft C# programming language", Category = "Programming", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "JavaScript", NormalizedName = "javascript", Description = "JavaScript programming language", Category = "Programming", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "Python", NormalizedName = "python", Description = "Python programming language", Category = "Programming", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "SQL", NormalizedName = "sql", Description = "Structured Query Language", Category = "Database", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "React", NormalizedName = "react", Description = "React JavaScript library", Category = "Frontend", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "Angular", NormalizedName = "angular", Description = "Angular framework", Category = "Frontend", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "ASP.NET Core", NormalizedName = "asp.net core", Description = "Microsoft ASP.NET Core framework", Category = "Backend", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "Entity Framework", NormalizedName = "entity framework", Description = "Microsoft Entity Framework ORM", Category = "Database", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "Git", NormalizedName = "git", Description = "Version control system", Category = "Tools", IsApproved = true, CreatedDate = DateTime.UtcNow },
                new AddSkill { Name = "Docker", NormalizedName = "docker", Description = "Containerization platform", Category = "DevOps", IsApproved = true, CreatedDate = DateTime.UtcNow }
            };

            await _context.AddSkills.AddRangeAsync(defaultSkills);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Successfully seeded {defaultSkills.Count} default skills");
        }

        private async Task<List<AddSkill>> LoadSkillsFromEscoApi()
        {
            var client = _httpClientFactory.CreateClient("EscoClient");

            // Get first page of skills (100 items)
            var response = await client.GetAsync("resource/skill?language=en&page=0&pageSize=100");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadFromJsonAsync<EscoApiResponse>();

            return content?._embedded?.skills.Select(s => new AddSkill
            {
                Name = s.title,
                NormalizedName = s.title.ToLowerInvariant(),
                Description = s.description ?? string.Empty,
                Category = s.skillType ?? "General",
                IsApproved = true,
                CreatedDate = DateTime.UtcNow
            }).ToList() ?? new List<AddSkill>();
        }
    }

    // ESCO API Response Models
    public class EscoApiResponse
    {
        [JsonPropertyName("_embedded")]
        public EscoEmbedded? _embedded { get; set; }
    }

    public class EscoEmbedded
    {
        public List<EscoSkill>? skills { get; set; }
    }

    public class EscoSkill
    {
        public string uri { get; set; } = string.Empty;
        public string title { get; set; } = string.Empty;
        public string? description { get; set; }
        public string? skillType { get; set; }
    }
}
