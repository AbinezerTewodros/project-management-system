using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;

namespace ProjectManagementSystem1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DebugProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DebugProgressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("check-data")]
        public async Task<IActionResult> CheckProgressData()
        {
            try
            {
                // Get all milestones with their tasks
                var milestones = await _context.Milestones
                    .Select(m => new
                    {
                        m.MilestoneId,
                        m.MilestoneName,
                        m.Progress,
                        m.Status,
                        m.ProjectId,
                        TaskCount = _context.ProjectTasks.Count(t => t.MilestoneId == m.MilestoneId),
                        Tasks = _context.ProjectTasks
                            .Where(t => t.MilestoneId == m.MilestoneId)
                            .Select(t => new
                            {
                                t.Id,
                                t.Title,
                                t.Progress,
                                t.Status,
                                TodoItemCount = t.TodoItems.Count,
                                ApprovedTodoCount = t.TodoItems.Count(ti => ti.Status == Model.Entities.TodoItemStatus.Approved)
                            })
                            .ToList()
                    })
                    .ToListAsync();

                // Get all projects
                var projects = await _context.Projects
                    .Select(p => new
                    {
                        p.Id,
                        p.ProjectName,
                        p.Progress,
                        p.Status,
                        MilestoneCount = _context.Milestones.Count(m => m.ProjectId == p.Id)
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    milestones,
                    projects,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}

