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
        [ProducesResponseType(typeof(MilestoneReadDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<MilestoneReadDto>> GetMilestoneById(int id)
        {
            var milestone = await _milestoneService.GetMilestoneByIdAsync(id);
            return milestone == null ? NotFound() : Ok(milestone);
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MilestoneReadDto>), 200)]
        public async Task<ActionResult<IEnumerable<MilestoneReadDto>>> GetAllMilestones()
        {
            var milestones = await _milestoneService.GetAllMilestoneAsync();
            return Ok(milestones);
        }

        [HttpGet("{milestoneId}/progress")]
        public async Task<ActionResult<double>> GetMilestoneProgress(int milestoneId)
        {
            try
            {
                var progress = await _milestoneService.CalculateMilestoneProgress(milestoneId);
                return Ok(new { Progress = progress });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error calculating progress: {ex.Message}");
            }
        }
        [HttpGet("project/{projectId}")]
        [ProducesResponseType(typeof(IEnumerable<MilestoneReadDto>), 200)]
        public async Task<ActionResult<IEnumerable<MilestoneReadDto>>> GetMilestonesByProjectId(int projectId)
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
                ModelState.AddModelError("MilestoneId", "URL ID doesn't match body ID");
            }

            var updatedMilestone = await _milestoneService.UpdateMilestoneAsync(id, dto);
            if (updatedMilestone == null)
            {
                return NotFound();
            }
            return Ok(updatedMilestone);
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
