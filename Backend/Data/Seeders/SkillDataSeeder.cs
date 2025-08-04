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

            var skills = await _skillService.LoadSkillsFromEscoApi(limit: 500); // Load first 500 skills
            await _context.AddSkills.AddRangeAsync(skills);
            await _context.SaveChangesAsync();
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
