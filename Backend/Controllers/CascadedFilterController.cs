using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.CascadedFilterDto;
using ProjectManagementSystem1.Services.CascadedFilterService;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CascadedFilterController : ControllerBase
    {
        private readonly ICascadedFilterService _cascadedFilterService;
        private readonly ILogger<CascadedFilterController> _logger;

        public CascadedFilterController(
            ICascadedFilterService cascadedFilterService,
            ILogger<CascadedFilterController> logger)
        {
            _cascadedFilterService = cascadedFilterService;
            _logger = logger;
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                var departments = await _cascadedFilterService.GetDepartmentsAsync();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting departments");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("projects")]
        public async Task<IActionResult> GetProjectsByDepartment([FromQuery] string department)
        {
            if (string.IsNullOrEmpty(department))
                return BadRequest("Department parameter is required");

            try
            {
                var projects = await _cascadedFilterService.GetProjectsByDepartmentAsync(department);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects for department {Department}", department);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("milestones")]
        public async Task<IActionResult> GetMilestonesByProject([FromQuery] int projectId)
        {
            if (projectId <= 0)
                return BadRequest("Valid project ID is required");

            try
            {
                var milestones = await _cascadedFilterService.GetMilestonesByProjectAsync(projectId);
                return Ok(milestones);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting milestones for project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("tasks")]
        public async Task<IActionResult> GetTasksByProject([FromQuery] int projectId)
        {
            if (projectId <= 0)
                return BadRequest("Valid project ID is required");

            try
            {
                var tasks = await _cascadedFilterService.GetTasksByProjectAsync(projectId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tasks for project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? department, [FromQuery] int? projectId)
        {
            try
            {
                List<FilterOptionDto> users;
                
                if (projectId.HasValue)
                {
                    users = await _cascadedFilterService.GetUsersByProjectAsync(projectId.Value);
                }
                else if (!string.IsNullOrEmpty(department))
                {
                    users = await _cascadedFilterService.GetUsersByDepartmentAsync(department);
                }
                else
                {
                    return BadRequest("Either department or project ID is required");
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("issues")]
        public async Task<IActionResult> GetIssues([FromQuery] int? projectId, [FromQuery] int? taskId)
        {
            try
            {
                List<FilterOptionDto> issues;

                if (taskId.HasValue)
                {
                    issues = await _cascadedFilterService.GetIssuesByTaskAsync(taskId.Value);
                }
                else if (projectId.HasValue)
                {
                    issues = await _cascadedFilterService.GetIssuesByProjectAsync(projectId.Value);
                }
                else
                {
                    return BadRequest("Either project ID or task ID is required");
                }

                return Ok(issues);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issues");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("filter-data")]
        public async Task<IActionResult> GetCascadedFilterData([FromBody] CascadedFilterRequestDto request)
        {
            try
            {
                var filterData = await _cascadedFilterService.GetCascadedFilterDataAsync(request);
                return Ok(filterData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cascaded filter data");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("all-filter-options")]
        public async Task<IActionResult> GetAllFilterOptions()
        {
            try
            {
                var request = new CascadedFilterRequestDto();
                var filterData = await _cascadedFilterService.GetCascadedFilterDataAsync(request);
                return Ok(filterData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all filter options");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
