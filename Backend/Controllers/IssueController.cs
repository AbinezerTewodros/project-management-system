using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectManagementSystem1.Model.Dto.Issue;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.IssueService;
using ProjectManagementSystem1.Helpers;
using System.Security.Claims; // Ensure this namespace is included
using Microsoft.AspNetCore.Authentication;
using System;

namespace YourProjectName.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Base route: /api/issues
    public class IssuesController : ControllerBase
    {
        private readonly IIssueService _issueService;

        public IssuesController(IIssueService issueService)
        {
            _issueService = issueService;
        }

        // POST /issues
    
        [HttpPost]
        [ProducesResponseType(typeof(IssueDto), 201)] // Created
        [ProducesResponseType(400)] // Bad Request
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> CreateIssue([FromBody] IssueCreateDto issueCreateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var reporterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;//get current user Id

                if (string.IsNullOrEmpty(reporterId))
                {
                    return Unauthorized("User not authenticated");
                }

                var createdIssue = await _issueService.CreateIssueAsync(issueCreateDto, reporterId);
                return CreatedAtAction(nameof(GetIssueById), new { issueId = createdIssue.Id }, createdIssue);
            }
            catch (InvalidOperationException ex) // Catch specific business rule violations
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception (e.g., using a logger)
                Console.WriteLine($"Error creating issue: {ex.Message}");
                return StatusCode(500, "An error occurred while creating the issue.");
            }
        }

        // PATCH /issues/{issueId}
        /// <summary>
        /// Updates an existing issue partially.
        /// </summary>
        /// <param name="issueId">The ID of the issue to update.</param>
        /// <param name="issueUpdateDto">The issue update data.</param>
        /// <returns>The updated issue.</returns>
        [HttpPut("{issueId}")]
        [ProducesResponseType(typeof(IssueDto), 200)] // OK
        [ProducesResponseType(400)] // Bad Request
        [ProducesResponseType(404)] // Not Found
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> UpdateIssue(int issueId, [FromBody] IssueUpdateDto issueUpdateDto)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;//reporter id is current user id

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var updatedIssue = await _issueService.UpdateIssueAsync(issueId, issueUpdateDto);
                if (updatedIssue == null)
                {
                    return NotFound($"Issue with ID {issueId} not found.");
                }
                return Ok(updatedIssue);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating issue {issueId}: {ex.Message}");
                return StatusCode(500, "An error occurred while updating the issue.");
            }
        }

        // DELETE /issues/{issueId}
        /// <summary>
        /// Deletes an issue by its ID.
        /// </summary>
        /// <param name="issueId">The ID of the issue to delete.</param>
        /// <returns>Confirmation of the deleted issue.</returns>
        [HttpDelete("{issueId}")]
        [ProducesResponseType(typeof(IssueDeletedDto), 200)] // OK if returning DTO
        [ProducesResponseType(404)] // Not Found
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> DeleteIssue(int issueId)
        {
            try
            {
                var deletedIssueDto = await _issueService.DeleteIssueAsync(issueId);

                if (deletedIssueDto == null)
                {
                    return NotFound($"Issue with ID {issueId} not found.");
                }

                // Return 200 OK with the DTO confirming deletion
                return Ok(deletedIssueDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting issue {issueId}: {ex.Message}");
                return StatusCode(500, "An error occurred while deleting the issue.");
            }
        }

        // GET /issues/{issueId}
        /// <summary>
        /// Gets an issue by its ID.
        /// </summary>
        /// <param name="issueId">The ID of the issue.</param>
        /// <returns>The issue with the specified ID.</returns>
        [HttpGet("{issueId}")]
        [ProducesResponseType(typeof(IssueDto), 200)] // OK
        [ProducesResponseType(404)] // Not Found
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> GetIssueById(int issueId)
        {
            try
            {
                var issue = await _issueService.GetIssueByIdAsync(issueId);
                if (issue == null)
                {
                    return NotFound($"Issue with ID {issueId} not found.");
                }
                return Ok(issue);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving issue {issueId}: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving the issue.");
            }
        }

        // GET /issues
        /// <summary>
        /// Gets all issues.
        /// </summary>
        /// <returns>A list of all issues.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<IssueDto>), 200)] // OK
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> GetAllIssues()
        {
            try
            {
                var issues = await _issueService.GetAllIssuesAsync();
                return Ok(issues);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving all issues: {ex.Message}");
                return StatusCode(500, "An error occurred while retrieving all issues.");
            }
        }

        // GET /issues/search
        /// <summary>
        /// Searches for issues based on provided criteria.
        /// </summary>
        /// <param name="searchDto">Search criteria (e.g., title, status, priority, assigneeId, reporterId, keywords).</param>
        /// <returns>A list of issues matching the criteria.</returns>
        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<IssueDto>), 200)] // OK
        [ProducesResponseType(400)] // Bad Request (if searchDto is invalid)
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> SearchIssues([FromQuery] IssueSearchDto searchDto)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;//reporter id is the current user id

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var issues = await _issueService.SearchIssuesAsync(searchDto);
                return Ok(issues);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error searching issues: {ex.Message}");
                return StatusCode(500, "An error occurred while searching issues.");
            }
        }

        // GET /issues/reports
        /// <summary>
        /// Gets a summary report of issues.
        /// </summary>
        /// <returns>A report detailing issue counts by status.</returns>
        [HttpGet("reports")]
        [ProducesResponseType(typeof(IEnumerable<IssueReportDto>), 200)] // OK
        [ProducesResponseType(500)] // Internal Server Error
        public async Task<IActionResult> GetIssueReports()
        {
            try
            {  
                var reports = await _issueService.GetIssueReportsAsync();
                return Ok(reports);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating issue reports: {ex.Message}");
                return StatusCode(500, "An error occurred while generating reports.");
            }
        }
    }
}