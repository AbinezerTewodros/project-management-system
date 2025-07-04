//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using ProjectManagementSystem1.Model.Dto;
//using ProjectManagementSystem1.Services;
//using ProjectManagementSystem1.Data;
//using System.Security.Claims;
//using System.Threading.Tasks;

//namespace ProjectManagementSystem1.Controllers
//{
//    [ApiController]
//    [Route("api/[controller]")]
//    public class SkillController : ControllerBase
//    {
//        private readonly ISkillService _skillService;
//        private readonly IUserSkillService _userSkillService;

//        public SkillController(ISkillService skillService, IUserSkillService userSkillService)
//        {
//            _skillService = skillService;
//            _userSkillService = userSkillService;
//        }

//        // GET: api/Skill/search?query=dot
//        [HttpGet("search")]
//        public async Task<IActionResult> SearchSkills(string query)
//        {
//            var results = await _skillService.SearchSkillsAsync(query);
//            return Ok(results);
//        }

//        // GET: api/Skill/suggest?query=dot
//        [HttpGet("suggest")]
//        [AllowAnonymous]
//        public async Task<IActionResult> SuggestSkills([FromQuery] string query)
//        {
//            if (string.IsNullOrWhiteSpace(query))
//                return BadRequest("Search query is required.");

//            var suggestions = await _skillService.GetSkillSuggestionsAsync(query);
//            return Ok(suggestions);
//        }

//        // POST: api/Skill/add-user-skill
//        [HttpPost("add-user-skill")]
//        [Authorize]
//        public async Task<IActionResult> AddSkillToUser([FromBody] AddSkillToUserDto dto)
//        {
//            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            if (string.IsNullOrEmpty(userId))
//                return Unauthorized();

//            await _skillService.AddSkillToUserAsync(userId, dto.SkillName);
//            return Ok("Skill added successfully.");
//        }

//        // POST: api/Skill/submit-new
//        [HttpPost("submit-new")]
//        [Authorize]
//        public async Task<IActionResult> SubmitNewSkill([FromBody] NewSkillRequestDto dto)
//        {
//            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            if (string.IsNullOrEmpty(userId))
//                return Unauthorized();

//            await _skillService.SubmitNewSkillRequestAsync(userId, dto.SkillName);
//            return Ok("Skill submitted for review.");
//        }

//        // GET: api/Skill/pending
//        [HttpGet("pending")]
//        [Authorize(Roles = "Admin")]
//        public async Task<IActionResult> GetPendingSkills()
//        {
//            var skills = await _skillService.GetPendingSkillsAsync();
//            return Ok(skills);
//        }

//        // PUT: api/Skill/approve/{skillId}
//        [HttpPut("approve/{skillId}")]
//        [Authorize(Roles = "Admin")]
//        public async Task<IActionResult> ApproveSkill(int skillId)
//        {
//            await _skillService.ApproveSkillAsync(skillId);
//            return Ok("Skill approved.");
//        }

//        // DELETE: api/Skill/reject/{skillId}
//        [HttpDelete("reject/{skillId}")]
//        [Authorize(Roles = "Admin")]
//        public async Task<IActionResult> RejectSkill(int skillId)
//        {
//            await _skillService.RejectSkillAsync(skillId);
//            return Ok("Skill rejected.");
//        }

//        // POST: api/Skill/assign
//        [HttpPost("assign")]
//        [Authorize]
//        public async Task<IActionResult> AssignSkillToUser([FromBody] AssignSkillDto dto)
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            if (string.IsNullOrEmpty(userId))
//                return Unauthorized();

//            try
//            {
//                await _userSkillService.AddSkillToUserAsync(userId, dto.SkillId);
//                return Ok("Skill assigned.");
//            }
//            catch (ArgumentException ex)
//            {
//                return NotFound(new { message = ex.Message });
//            }
//            catch (InvalidOperationException ex)
//            {
//                return BadRequest(new { message = ex.Message });
//            }
//        }
//    }
//}
