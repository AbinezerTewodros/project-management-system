using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.AddSkill;
using ProjectManagementSystem1.Services.AddSkillService;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    public class SkillsController : ControllerBase
    {
        private readonly ISkillService _skillService;
        private readonly AppDbContext _context;

        public SkillsController(ISkillService skillService, AppDbContext context)
        {
            _skillService = skillService;
            _context = context;
        }

        [HttpPost("myskills")]
        [Authorize]
        public async Task<IActionResult> AddSkillToMyProfile([FromBody] AddSkillRequestDto request)
        {
            // Verify skill exists first
            var skillExists = await _context.AddSkills.AnyAsync(s => s.Id == request.SkillId);
            if (!skillExists)
            {
                return NotFound($"Skill with ID {request.SkillId} not found. Search for available skills first.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _skillService.AddSkillToUserAsync(userId, request.SkillId, request.Proficiency);
            return Ok();
        }


        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] int limit = 10)
        {
            // Debugging output
            Console.WriteLine($"Search query: {query}, Limit: {limit}");

            var results = await _skillService.SearchSkillsAsync(query, limit);

            if (!results.Any())
            {
                Console.WriteLine("No results found - checking database...");
                var dbSkills = await _context.AddSkills.ToListAsync();
                Console.WriteLine($"Total skills in DB: {dbSkills.Count}");
            }

            return Ok(results);
        }

        [HttpPost("user/{userId}")]
        public async Task<IActionResult> AddUserSkill(string userId, [FromBody] UserSkillDto dto)
        {
            await _skillService.AddSkillToUserAsync(userId, dto.SkillId, dto.Proficiency);
            return Ok();
        }

        [HttpGet("user/{id}")]
        public async Task<IActionResult> GetUserSkills(int id)
        {
            var skill = await _skillService.GetUserSkillsAsync(id);
            if (skill == null) return NotFound();
            return Ok(skill);
        }

       [HttpDelete("user/{userId}/skill/{skillId}")]
        public async Task<IActionResult> RemoveUserSkill(string userId, int skillId)
        {
            await _skillService.RemoveSkillFromUserAsync(userId, skillId);
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<SkillDto>> CreateSkill([FromBody] SkillCreateDto dto)
        {
            var skill = await _skillService.CreateSkillAsync(dto);
            return CreatedAtAction(nameof(GetUserSkills), new { id = skill.Id }, skill);
        }

        [HttpPut("approve/{skillId}")]
        public async Task<IActionResult> ApproveSkill(int skillId)
        {
            await _skillService.ApproveSkillAsync(skillId);
            return NoContent();
        }

        [HttpPost("endorse/{userId}/{skillId}")]
        [Authorize]
        public async Task<IActionResult> EndorseSkill(string userId, int skillId)
        {
            var endorserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Prevent self-endorsement
            if (endorserId == userId)
                return BadRequest("Cannot endorse your own skill");

            await _skillService.EndorseSkillAsync(userId, skillId);
            return Ok();
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")] // Ensure only admins can access
        public async Task<ActionResult<IEnumerable<SkillDto>>> GetPendingSkills()
        {
            var skills = await _skillService.GetPendingSkillsAsync();
            return Ok(skills);
        }

        [HttpGet("pending/count")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<int>> GetPendingSkillsCount()
        {
            var count = await _skillService.GetPendingSkillsCountAsync();
            return Ok(count);
        }

    }
}
