using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Controllers.Base;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Services.ProjectService;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Model.Exceptions;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers
{
    /// <summary>
    /// Controller for managing project-related operations including CRUD operations,
    /// project archiving/restoration, and project retrieval by various criteria.
    /// </summary>
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : BaseApiController
    {
        private readonly IProjectService _projectService;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public ProjectController(IProjectService projectService, AppDbContext context, 
            INotificationService notificationService, ILogger<ProjectController> logger)
            : base(logger)
        {
            _projectService = projectService;
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Retrieves all projects for the current user's department.
        /// Accessible by users with higher role.
        /// </summary>
        /// <returns>A list of projects for the user's department</returns>
        /// <response code="200">Returns the list of projects</response>
        /// <response code="403">If the user is not authorized or lacks department claim</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("All-projects")]
        [Authorize(Roles = "Admin,President,Vice-President,Director,Manager,Supervisor,Member")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectDto>>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetProjects()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Forbid();

            var projects = await _projectService.GetAllVisibleAsync(userId);
            return Ok(projects);
        
            //try
            //{
            //    var departmentValidation = ValidateUserDepartment();
            //    if (departmentValidation != null)
            //        return departmentValidation;

            //    var projects = await _projectService.GetAllAsync(GetCurrentUserDepartment());
            //    return SuccessResponse(projects, "Projects retrieved successfully");
            //}
            //catch (Exception ex)
            //{
            //    return HandleException(ex, "retrieving projects");
            //}
        }

        /// <summary>
        /// Retrieves a specific project by its ID.
        /// </summary>
        /// <param name="id">The unique identifier of the project</param>
        /// <returns>The project with the specified ID</returns>
        /// <response code="200">Returns the requested project</response>
        /// <response code="400">If the project ID is invalid</response>
        /// <response code="404">If the project was not found</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetProject(int id)
        {
            try
            {
                var idValidation = ValidateId(id, "Project");
                if (idValidation != null)
                    return idValidation;

                var project = await _projectService.GetByIdAsync(id);
                if (project == null)
                {
                    return NotFoundResponse("Project", id);
                }

                return SuccessResponse(project, "Project retrieved successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "retrieving the project", id);
            }
        }

        [HttpGet("by-priority/{priority}")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectDto>>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> GetProjectsByPriority(string priority)
        {
            try
            {
                var priorityValidation = ValidateRequiredString(priority, "Priority");
                if (priorityValidation != null)
                    return priorityValidation;

                var validPriorities = new[] { "Low", "Medium", "High", "Critical" };
                var enumValidation = ValidateEnumValue(priority, validPriorities, "Priority");
                if (enumValidation != null)
                    return enumValidation;

                var projects = await _context.Projects
                    .Where(p => p.Priority.ToLower() == priority.ToLower())
                    .ToListAsync();

                return SuccessResponse(projects, $"Projects with priority {priority} retrieved successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "retrieving projects by priority");
            }
        }

        /// <summary>
        /// Creates a new project.
        /// </summary>
        /// <param name="dto">The project creation data</param>
        /// <returns>The newly created project</returns>
        /// <response code="201">Returns the newly created project</response>
        /// <response code="400">If the request data is invalid</response>
        /// <response code="401">If the user is not authenticated</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 401)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
        {
            try
            {
                var modelStateValidation = ValidateModelState();
                if (modelStateValidation != null)
                    return modelStateValidation;

                var authValidation = ValidateUserAuthenticated();
                if (authValidation != null)
                    return authValidation;

                var created = await _projectService.CreateAsync(dto, GetCurrentUserId());
                
                // Send notification for project creation
                try
                {
                    await _notificationService.NotifyProjectCreatedAsync(created.Id, GetCurrentUserId());
                }
                catch (Exception notificationEx)
                {
                    _logger.LogWarning($"Failed to send project creation notification: {notificationEx.Message}");
                }
                
                return CreatedResponse(created, nameof(GetProject), new { id = created.Id }, "Project created successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "creating the project");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto dto)
        {
            try
            {
                var idValidation = ValidateId(id, "Project");
                if (idValidation != null)
                    return idValidation;

                var modelStateValidation = ValidateModelState();
                if (modelStateValidation != null)
                    return modelStateValidation;

                var updated = await _projectService.UpdateAsync(id, dto, GetCurrentUserId());
                
                if (!updated)
                {
                    return NotFoundResponse("Project", id);
                }

                // Send notification for project update
                try
                {
                    await _notificationService.SendNotificationAsync(
                        GetCurrentUserId(),
                        "Project Updated",
                        $"Project '{dto.ProjectName ?? "Project"}' has been updated successfully.",
                        "ProjectUpdate",
                        "Project",
                        id
                    );
                }
                catch (Exception notificationEx)
                {
                    _logger.LogWarning($"Failed to send project update notification: {notificationEx.Message}");
                }

                return SuccessResponse(updated, "Project updated successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "updating the project", id);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse), 204)]
        [ProducesResponseType(typeof(ApiResponse), 403)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var idValidation = ValidateId(id, "Project");
                if (idValidation != null)
                    return idValidation;

                var deleted = await _projectService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFoundResponse("Project", id);
                }

                return NoContentResponse("Project deleted successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "deleting the project", id);
            }
        }

        [HttpPost("{id}/archive")]
        [ProducesResponseType(typeof(ApiResponse), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> ArchiveProject(int id)
        {
            try
            {
                var idValidation = ValidateId(id, "Project");
                if (idValidation != null)
                    return idValidation;

                await _projectService.ArchiveProjectAsync(id, GetCurrentUserId());
                
                // Send notification for project archive
                try
                {
                    await _notificationService.SendNotificationAsync(
                        GetCurrentUserId(),
                        "Project Archived",
                        "A project has been archived successfully.",
                        "ProjectArchive",
                        "Project",
                        id
                    );
                }
                catch (Exception notificationEx)
                {
                    _logger.LogWarning($"Failed to send project archive notification: {notificationEx.Message}");
                }
                
                return SuccessResponse("Project archived successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "archiving the project", id);
            }
        }

        [HttpPost("{id}/restore")]
        [ProducesResponseType(typeof(ApiResponse), 200)]
        [ProducesResponseType(typeof(ApiResponse), 400)]
        [ProducesResponseType(typeof(ApiResponse), 404)]
        [ProducesResponseType(typeof(ApiResponse), 500)]
        public async Task<IActionResult> RestoreProject(int id)
        {
            try
            {
                var idValidation = ValidateId(id, "Project");
                if (idValidation != null)
                    return idValidation;

                await _projectService.RestoreProjectAsync(id, GetCurrentUserId());
                
                // Send notification for project restore
                try
                {
                    await _notificationService.SendNotificationAsync(
                        GetCurrentUserId(),
                        "Project Restored",
                        "A project has been restored successfully.",
                        "ProjectRestore",
                        "Project",
                        id
                    );
                }
                catch (Exception notificationEx)
                {
                    _logger.LogWarning($"Failed to send project restore notification: {notificationEx.Message}");
                }
                
                return SuccessResponse("Project restored successfully");
            }
            catch (Exception ex)
            {
                return HandleException(ex, "restoring the project", id);
            }
        }


    }
}
