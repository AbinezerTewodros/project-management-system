using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.ProjectService;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;

namespace ProjectManagementSystem1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProgressRecalculationController : ControllerBase
    {
        private readonly IMilestoneService _milestoneService;
        private readonly IProjectService _projectService;
        private readonly AppDbContext _context;

        public ProgressRecalculationController(
            IMilestoneService milestoneService,
            IProjectService projectService,
            AppDbContext context)
        {
            _milestoneService = milestoneService;
            _projectService = projectService;
            _context = context;
        }

        /// <summary>
        /// ✅ One-time recalculation of ALL milestone and project progress
        /// Call this once to update all existing data
        /// </summary>
        [HttpPost("recalculate-all")]
        public async Task<IActionResult> RecalculateAllProgress()
        {
            try
            {
                Console.WriteLine("🔄 Starting full progress recalculation...");

                int milestonesUpdated = 0;
                int projectsUpdated = 0;

                // Step 1: Recalculate all milestone progress
                var allMilestones = await _context.Milestones.ToListAsync();
                Console.WriteLine($"📊 Found {allMilestones.Count} milestones to recalculate");

                foreach (var milestone in allMilestones)
                {
                    try
                    {
                        await _milestoneService.UpdateMilestoneProgress(milestone.MilestoneId);
                        milestonesUpdated++;
                        Console.WriteLine($"✅ Updated milestone {milestone.MilestoneId} ({milestone.MilestoneName})");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Error updating milestone {milestone.MilestoneId}: {ex.Message}");
                    }
                }

                // Step 2: Recalculate all project progress
                var allProjects = await _context.Projects.ToListAsync();
                Console.WriteLine($"📊 Found {allProjects.Count} projects to recalculate");

                foreach (var project in allProjects)
                {
                    try
                    {
                        await _projectService.UpdateProjectProgress(project.Id);
                        projectsUpdated++;
                        Console.WriteLine($"✅ Updated project {project.Id} ({project.ProjectName})");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Error updating project {project.Id}: {ex.Message}");
                    }
                }

                var result = new
                {
                    success = true,
                    message = "Progress recalculation completed",
                    milestonesUpdated,
                    projectsUpdated,
                    totalMilestones = allMilestones.Count,
                    totalProjects = allProjects.Count
                };

                Console.WriteLine($"✅ Recalculation complete! Milestones: {milestonesUpdated}/{allMilestones.Count}, Projects: {projectsUpdated}/{allProjects.Count}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Fatal error during recalculation: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Recalculate progress for a specific project and all its milestones
        /// </summary>
        [HttpPost("recalculate-project/{projectId}")]
        public async Task<IActionResult> RecalculateProjectProgress(int projectId)
        {
            try
            {
                // Recalculate all milestones in this project
                var milestones = await _context.Milestones
                    .Where(m => m.ProjectId == projectId)
                    .ToListAsync();

                foreach (var milestone in milestones)
                {
                    await _milestoneService.UpdateMilestoneProgress(milestone.MilestoneId);
                }

                // Recalculate project progress
                await _projectService.UpdateProjectProgress(projectId);

                return Ok(new
                {
                    success = true,
                    message = $"Recalculated progress for project {projectId}",
                    milestonesUpdated = milestones.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Recalculate progress for a specific milestone
        /// </summary>
        [HttpPost("recalculate-milestone/{milestoneId}")]
        public async Task<IActionResult> RecalculateMilestoneProgress(int milestoneId)
        {
            try
            {
                await _milestoneService.UpdateMilestoneProgress(milestoneId);

                return Ok(new
                {
                    success = true,
                    message = $"Recalculated progress for milestone {milestoneId}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

