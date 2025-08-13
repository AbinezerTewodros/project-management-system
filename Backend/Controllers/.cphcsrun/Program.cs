using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ActivityLogController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivityLog(
            [FromQuery] string entityType = null,
            [FromQuery] int? entityId = null,
            [FromQuery] string actionType = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            IQueryable<ActivityLog> query = _context.ActivityLogs.OrderByDescending(log => log.Timestamp);

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(log => log.EntityType.ToLower() == entityType.ToLower());
            }

            if (entityId.HasValue)
            {
                query = query.Where(log => log.EntityId == entityId);
            }

            if (!string.IsNullOrEmpty(actionType))
            {
                query = query.Where(log => log.ActionType.ToLower() == actionType.ToLower());
            }

            var totalCount = await query.CountAsync();
            var logs = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                Logs = logs
            });
        }

        [HttpGet("{entityType}/{entityId}")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetEntityHistoryAsync(string entityType, int entityId)
        {
            if (string.IsNullOrEmpty(entityType))
            {
                return BadRequest("EntityType is required.");
            }

            var entityLogs = await _context.ActivityLogs
                .Where(log => log.EntityType.ToLower() == entityType.ToLower() && log.EntityId == entityId)
                .OrderByDescending(log => log.Timestamp)
                .ToListAsync();

            return Ok(entityLogs);
        }
    }
}