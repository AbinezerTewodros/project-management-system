using AutoMapper;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Data.Seeders;
using ProjectManagementSystem1.Model.Dto.AddSkill;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.AddSkillService;
using System.Net.Http;
using System.Text.Json;

namespace ProjectManagementSystem1.Services.AddSkillService
{
    public class SkillService : ISkillService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper; // AutoMapper if using
        private readonly IMemoryCache _cache;
        private readonly ILogger<SkillService> _logger;
        private const string SkillCacheKey = "Skills_Popular";
        private readonly TimeSpan CacheDuration = TimeSpan.FromHours(6);
        private readonly IHttpClientFactory _httpClientFactory;
        public SkillService(AppDbContext context, IMapper mapper,
            IMemoryCache cache, ILogger<SkillService> logger
            , IHttpClientFactory httpClientFactory    )
        {
            _context = context;
            _mapper = mapper;
            _cache = cache;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }



        public async Task AddSkillToUserAsync(string userId, int skillId, ProficiencyLevel? proficiency = null)
        {
            var skillExists = await _context.AddSkills.AnyAsync(s => s.Id == skillId);
            if (!skillExists)
            {
                throw new KeyNotFoundException($"Skill with ID {skillId} not found");
            }

            // Check if user already has this skill
            var existing = await _context.UserSkills
        .FirstOrDefaultAsync(us => us.UserId == userId && us.SkillId == skillId);

            if (existing != null)
            {
                existing.Proficiency = proficiency;
            }
            else
            {
                var userSkill = new UserSkill
                {
                    UserId = userId,
                    SkillId = skillId,
                    Proficiency = proficiency,
                    EndorsementCount = 0
                };
                _context.UserSkills.Add(userSkill);
            }

            await _context.SaveChangesAsync();
            _cache.Remove($"UserSkills_{userId}");

        }

        public async Task EndorseSkillAsync(string userId, int skillId)
        {
            var userSkill = await _context.UserSkills
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SkillId == skillId);

            if (userSkill != null)
            {
                userSkill.EndorsementCount++;
                await _context.SaveChangesAsync();
                _cache.Remove($"UserSkills_{userId}");
            }
        }
        public async Task RemoveSkillFromUserAsync(string userId, int skillId)
        {
            var userSkill = await _context.UserSkills
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SkillId == skillId);

            if (userSkill != null)
            {
                _context.UserSkills.Remove(userSkill);
                await _context.SaveChangesAsync();
                _cache.Remove($"UserSkills_{userId}");
            }
        }

        public async Task<IEnumerable<UserSkillDto>> GetUserSkillsAsync(int id)
        {
            try
            {
                var cacheKey = $"UserSkills_{id}";

                return await _cache.GetOrCreateAsync(cacheKey, async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);

                    var skills = await _context.UserSkills
                        .AsNoTracking() // Better performance for read-only
                        .Where(us => us.UserId == id.ToString()) // Ensure proper type comparison
                        .Include(us => us.Skill)
                        .Select(us => new UserSkillDto
                        {
                            SkillId = us.SkillId,
                            SkillName = us.Skill.Name,
                            Proficiency = us.Proficiency,
                            EndorsementCount = us.EndorsementCount // Added if you have this property
                        })
                        .ToListAsync();

                    // Ensure we cache empty lists too to prevent DB hits
                    return skills ?? new List<UserSkillDto>();
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills for user {UserId}", id);
                throw; // Or return empty list if preferred
            }
        }

        public async Task<SkillDto> CreateSkillAsync(SkillCreateDto dto)
        {
            // Normalize the name for comparison
            var normalizedName = dto.Name.Trim().ToLowerInvariant();

            // Check if skill already exists (case insensitive)
            var existingSkill = await _context.AddSkills
                .FirstOrDefaultAsync(s => s.NormalizedName == normalizedName);

            if (existingSkill != null)
            {
                return _mapper.Map<SkillDto>(existingSkill);
            }

            var newSkill = new AddSkill // Changed from Skill to AddSkill
            {
                Name = dto.Name,
                NormalizedName = normalizedName,
                Category = dto.Category,
                Description = dto.Description,
                IsApproved = true // Or false if you need approval workflow
            };

            _context.AddSkills.Add(newSkill);
            await _context.SaveChangesAsync();

            return _mapper.Map<SkillDto>(newSkill);
        }

        public async Task ApproveSkillAsync(int skillId)
        {
            var skill = await _context.AddSkills.FindAsync(skillId);

            if (skill == null)
            {
                throw new KeyNotFoundException($"Skill with ID {skillId} not found");
            }

            skill.IsApproved = true;
            await _context.SaveChangesAsync();

            _cache.Remove(SkillCacheKey);
            _logger.LogInformation("Skill {SkillId} approved by admin", skillId);
        }

        // Updated SearchSkillsAsync to work with AddSkills table
        public async Task<IEnumerable<SkillDto>> SearchSkillsAsync(string query, int limit = 10)
        {
            // 1. First try local database
            var localResults = await _context.AddSkills
                .Where(s => s.IsApproved &&
                           (string.IsNullOrEmpty(query) ||
                            EF.Functions.Like(s.NormalizedName, $"%{query.ToLower()}%") ||
                            EF.Functions.Like(s.Name, $"%{query}%")))
                .OrderByDescending(s => s.UserSkills.Count)
                .Take(limit)
                .Select(s => _mapper.Map<SkillDto>(s))
                .ToListAsync();

            if (localResults.Any()) return localResults;

            // 2. Fallback to ESCO API with correct parameters
            try
            {
                var client = _httpClientFactory.CreateClient("EscoClient");

                // Use the correct parameter format
                var requestUri = $"resource/skill?text={Uri.EscapeDataString(query)}" +
                                 $"&language=en" +
                                 $"&isInScheme=http://data.europa.eu/esco/concept-scheme/member-skills" +
                                 $"&limit={limit}";

                var response = await client.GetAsync(requestUri);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadFromJsonAsync<EscoApiResponse>();
                    var skills = content?._embedded?.skills ?? new List<EscoSkill>();

                    // Cache new skills in database
                    var newSkills = skills.Where(es =>
                        !_context.AddSkills.Any(s => s.NormalizedName == es.title.ToLower()))
                        .Select(s => new AddSkill
                        {
                            Name = s.title,
                            NormalizedName = s.title.ToLower(),
                            Description = s.description ?? string.Empty,
                            Category = s.skillType ?? "General",
                            IsApproved = true
                        });

                    await _context.AddSkills.AddRangeAsync(newSkills);
                    await _context.SaveChangesAsync();

                    return skills.Select(s => new SkillDto
                    {
                        Id = s.uri.GetHashCode(), // Temporary ID
                        Name = s.title,
                        Category = s.skillType ?? "General",
                        Description = s.description ?? string.Empty
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"ESCO API Error: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ESCO API failed");
            }

            return Enumerable.Empty<SkillDto>();
        }


        // In SkillService.cs
        public async Task<List<AddSkill>> LoadSkillsFromEscoApi(string query = "", int limit = 100)
        {
            var client = _httpClientFactory.CreateClient("EscoClient");

            var queryParams = new Dictionary<string, string>
            {
                ["offset"] = "0",
                ["limit"] = limit.ToString(),
                ["language"] = "en",
                ["isInScheme"] = "http://data.europa.eu/esco/concept-scheme/member-skills" // Hardcoded scheme
            };

            if (!string.IsNullOrEmpty(query))
            {
                queryParams["text"] = query;
            }

            var requestUri = QueryHelpers.AddQueryString("resource/skill", queryParams);

            var response = await client.GetAsync(requestUri);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"ESCO API Error: {response.StatusCode} - {errorContent}");
                return new List<AddSkill>(); // Return empty rather than throwing
            }

            var content = await response.Content.ReadFromJsonAsync<EscoApiResponse>();
            return content?._embedded?.skills.Select(s => new AddSkill
            {
                Name = s.title,
                NormalizedName = s.title.ToLowerInvariant(),
                Description = s.description ?? string.Empty,
                Category = s.skillType ?? "General",
                IsApproved = true
            }).ToList() ?? new List<AddSkill>();
        }
        public async Task<List<AddSkill>> FetchSkillsFromEsco()
        {
            const string schemeUri = "http://data.europa.eu/esco/concept-scheme/member-skills";
            var apiUrl = $"resource/skill?isInScheme={Uri.EscapeDataString(schemeUri)}&language=en";

            var client = _httpClientFactory.CreateClient("EscoClient");
            var response = await client.GetAsync(apiUrl);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("ESCO API Error: {StatusCode} - {ErrorContent}", response.StatusCode, errorContent);
                return new List<AddSkill>();
            }

            var content = await response.Content.ReadFromJsonAsync<EscoApiResponse>();
            return content?._embedded?.skills.Select(s => new AddSkill
            {
                Name = s.title,
                NormalizedName = s.title.ToLowerInvariant(),
                Description = s.description ?? string.Empty,
                Category = s.skillType ?? "General",
                IsApproved = true
            }).ToList() ?? new List<AddSkill>();
        } 
        public async Task<IEnumerable<SkillDto>> GetPendingSkillsAsync()
        {
            try
            {
                return await _context.AddSkills
                    .AsNoTracking()
                    .Where(s => !s.IsApproved)
                    .OrderBy(s => s.Name)
                    .Select(s => new SkillDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Category = s.Category,
                        Description = s.Description
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending skills");
                throw;
            }
        }

        public async Task<int> GetPendingSkillsCountAsync()
        {
            try
            {
                return await _context.AddSkills
                    .AsNoTracking()
                    .CountAsync(s => !s.IsApproved);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting pending skills");
                throw;
            }
        }
    }
}
