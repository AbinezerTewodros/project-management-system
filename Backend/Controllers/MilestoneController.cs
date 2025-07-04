using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.MilestoneService;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MilestoneController : ControllerBase
    {
        private readonly IMilestoneService _milestoneService;

        public MilestoneController(IMilestoneService milestoneService)
        {
            _milestoneService = milestoneService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Milestone>> GetMilestoneById(int id)
        {
            var milestone = await _milestoneService.GetMilestoneByIdAsync(id);
            if (milestone == null)
            {
                return NotFound();
            }
            return Ok(milestone);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Milestone>>> GetAllMilestones()
        {
            var milestones = await _milestoneService.GetAllMilestoneAsync();
            return Ok(milestones);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<Milestone>>> GetMilestonesByProjectId(int projectId)
        {
            var milestones = await _milestoneService.GetMilestonesByProjectIdAsync(projectId);
            return Ok(milestones);
        }

        [HttpPost("create-milestone")]
        public async Task<IActionResult> Create([FromBody] CreateMilestoneDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var milestone = await _milestoneService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetMilestoneById), new { id = milestone.MilestoneId }, milestone);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMilestone(int id, [FromBody] UpdateMilestoneDto dto) // Changed parameter type
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (id != dto.MilestoneId)
            {
                return BadRequest("The ID in the URL does not match the ID in the request body.");
            }
            var updatedMilestone = await _milestoneService.UpdateMilestoneAsync(id, dto);
            if (updatedMilestone == null)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMilestone(int id)
        {
            var result = await _milestoneService.DeleteMilestoneAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
