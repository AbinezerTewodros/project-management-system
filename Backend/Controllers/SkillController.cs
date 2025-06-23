using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Model;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillController : ControllerBase
    {
        private readonly ISkillService _skillService;

        public SkillController(ISkillService skillService)
        {
            _skillService = skillService;
        }

        // GET: api/Skill/search?query=dot
        [HttpGet("search")]
        public async Task<IActionResult> SearchSkills(string query)
        {
            var results = await _skillService.SearchSkillsAsync(query);
            return Ok(results);
        }

        // GET: api/Skill/suggestions?query=dot
        [HttpGet("suggestions")]
        [AllowAnonymous] // or [Authorize] if it should require login
        public async Task<IActionResult> GetSkillSuggestions([FromQuery] string query)
        {
            // GET: api/Skill/suggest?query=xyz
            [HttpGet("suggest")]
            public async Task<IActionResult> SuggestSkills(string query)
            {
                if (string.IsNullOrWhiteSpace(query))
                    return BadRequest("Search query is required.");

                var suggestions = await _skillService.GetSkillSuggestionsAsync(query);
                return Ok(suggestions);
            }

            // POST: api/Skill/add-user-skill
            [HttpPost("add-user-skill")]
            [Authorize]
            public async Task<IActionResult> AddSkillToUser([FromBody] AddSkillToUserDto dto)
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _skillService.AddSkillToUserAsync(userId, dto.SkillName);
                return Ok("Skill added successfully.");
            }
        }

        // POST: api/Skill/submit-new
        [HttpPost("submit-new")]
        [Authorize]
        public async Task<IActionResult> SubmitNewSkill([FromBody] NewSkillRequestDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _skillService.SubmitNewSkillRequestAsync(userId, dto.SkillName);
            return Ok("Skill submitted for review.");
        }

        // GET: api/Skill/pending
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingSkills()
        {
            var skills = await _skillService.GetPendingSkillsAsync();
            return Ok(skills);
        }

        // PUT: api/Skill/approve
        [HttpPut("approve/{skillId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveSkill(int skillId)
        {
            await _skillService.ApproveSkillAsync(skillId);
            return Ok("Skill approved.");
        }

        // DELETE: api/Skill/reject
        [HttpDelete("reject/{skillId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectSkill(int skillId)
        {
            await _skillService.RejectSkillAsync(skillId);
            return Ok("Skill rejected.");
        }
<<<<<<< HEAD

        [HttpPost("assign")]
        [Authorize] // make sure user is logged in
        public async Task<IActionResult> AssignSkillToUser([FromBody] AssignSkillDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                await _userSkillService.AddSkillToUserAsync(userId, dto.SkillId);
                return Ok("Skill assigned.");
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
=======
    }
}
>>>>>>> 1d16b8f860a803c113b38c92c14fe69c8c7adebb
