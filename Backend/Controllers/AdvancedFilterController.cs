using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Services.Common;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdvancedFilterController : ControllerBase
    {
        private readonly IAdvancedFilterService _advancedFilterService;
        private readonly ILogger<AdvancedFilterController> _logger;

        public AdvancedFilterController(
            IAdvancedFilterService advancedFilterService,
            ILogger<AdvancedFilterController> logger)
        {
            _advancedFilterService = advancedFilterService;
            _logger = logger;
        }

        // Project Filtering
        [HttpPost("projects")]
        public async Task<IActionResult> FilterProjects([FromBody] ProjectFilterDto filterDto)
        {
            try
            {
                var result = await _advancedFilterService.FilterProjectsAsync(filterDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering projects");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("projects/options")]
        public async Task<IActionResult> GetProjectFilterOptions()
        {
            try
            {
                var options = await _advancedFilterService.GetProjectFilterOptionsAsync();
                return Ok(options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project filter options");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("projects/values")]
        public async Task<IActionResult> GetProjectFilterValues()
        {
            try
            {
                var values = await _advancedFilterService.GetProjectFilterValuesAsync();
                return Ok(values);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project filter values");
                return StatusCode(500, "Internal server error");
            }
        }

        // Task Filtering
        [HttpPost("tasks")]
        public async Task<IActionResult> FilterTasks([FromBody] TaskFilterDto filterDto)
        {
            try
            {
                var result = await _advancedFilterService.FilterTasksAsync(filterDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering tasks");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("tasks/options")]
        public async Task<IActionResult> GetTaskFilterOptions()
        {
            try
            {
                var options = await _advancedFilterService.GetTaskFilterOptionsAsync();
                return Ok(options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task filter options");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("tasks/values")]
        public async Task<IActionResult> GetTaskFilterValues()
        {
            try
            {
                var values = await _advancedFilterService.GetTaskFilterValuesAsync();
                return Ok(values);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task filter values");
                return StatusCode(500, "Internal server error");
            }
        }

        // Assignment Filtering
        [HttpPost("assignments")]
        public async Task<IActionResult> FilterAssignments([FromBody] AssignmentFilterDto filterDto)
        {
            try
            {
                var result = await _advancedFilterService.FilterAssignmentsAsync(filterDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering assignments");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("assignments/options")]
        public async Task<IActionResult> GetAssignmentFilterOptions()
        {
            try
            {
                var options = await _advancedFilterService.GetAssignmentFilterOptionsAsync();
                return Ok(options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment filter options");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("assignments/values")]
        public async Task<IActionResult> GetAssignmentFilterValues()
        {
            try
            {
                var values = await _advancedFilterService.GetAssignmentFilterValuesAsync();
                return Ok(values);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment filter values");
                return StatusCode(500, "Internal server error");
            }
        }

        // Issue Filtering
        [HttpPost("issues")]
        public async Task<IActionResult> FilterIssues([FromBody] IssueFilterDto filterDto)
        {
            try
            {
                var result = await _advancedFilterService.FilterIssuesAsync(filterDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering issues");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("issues/options")]
        public async Task<IActionResult> GetIssueFilterOptions()
        {
            try
            {
                var options = await _advancedFilterService.GetIssueFilterOptionsAsync();
                return Ok(options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issue filter options");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("issues/values")]
        public async Task<IActionResult> GetIssueFilterValues()
        {
            try
            {
                var values = await _advancedFilterService.GetIssueFilterValuesAsync();
                return Ok(values);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issue filter values");
                return StatusCode(500, "Internal server error");
            }
        }

        // Cascaded Filtering
        [HttpPost("cascaded")]
        public async Task<IActionResult> ApplyCascadedFilter([FromBody] CascadedFilterRequest request)
        {
            try
            {
                // This would need to be implemented based on the specific entity type
                // For now, return a generic response
                return Ok(new { Message = "Cascaded filtering endpoint ready for implementation" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying cascaded filter");
                return StatusCode(500, "Internal server error");
            }
        }

        // Search
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string searchTerm, [FromQuery] string? searchFields = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest("Search term is required");
                }

                // This would need to be implemented based on the specific entity type
                // For now, return a generic response
                return Ok(new { Message = "Search endpoint ready for implementation", SearchTerm = searchTerm, SearchFields = searchFields });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing search");
                return StatusCode(500, "Internal server error");
            }
        }

        // Filter Validation
        [HttpPost("validate")]
        public async Task<IActionResult> ValidateFilter([FromBody] AdvancedFilterDto filterDto)
        {
            try
            {
                var isValid = _advancedFilterService.ValidateFilter(filterDto);
                var errors = _advancedFilterService.GetValidationErrors(filterDto);

                return Ok(new
                {
                    IsValid = isValid,
                    Errors = errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating filter");
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class CascadedFilterRequest
    {
        public string EntityType { get; set; } = string.Empty;
        public CascadedFilterDto Filter { get; set; } = new CascadedFilterDto();
    }
}
