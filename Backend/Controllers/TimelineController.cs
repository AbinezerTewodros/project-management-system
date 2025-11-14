using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services.TimelineService;
using ProjectManagementSystem1.Model.Dto.TimelineDto;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/timeline")]
    public class TimelineController : ControllerBase
    {
        private readonly ITimelineService _timelineService;
        private readonly ILogger<TimelineController> _logger;

        public TimelineController(ITimelineService timelineService, ILogger<TimelineController> logger)
        {
            _timelineService = timelineService ?? throw new ArgumentNullException(nameof(timelineService));
            _logger = logger;
        }

        // GET: api/timeline/projects/{projectId}
        [HttpGet("projects/{projectId}")]
        public async Task<IActionResult> GetProjectTimeline(int projectId)
        {
            try
            {
                var timelines = await _timelineService.GetTimelineByProject(projectId);
                return Ok(timelines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch timeline events" });
            }
        }

        // GET: api/timeline/projecttask/{projectTaskId}
        [HttpGet("projecttask/{projectTaskId}")]
        public async Task<IActionResult> GetProjectTaskTimeline(int projectTaskId)
        {
            try
            {
                var timelines = await _timelineService.GetTimelineByProjectTask(projectTaskId);
                return Ok(timelines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch timeline for project task" });
            }
        }

        // GET: api/timeline/milestone/{milestoneId}
        [HttpGet("milestone/{milestoneId}")]
        public async Task<IActionResult> GetMilestoneTimeline(int milestoneId)
        {
            try
            {
                var timelines = await _timelineService.GetTimelineByMilestone(milestoneId);
                return Ok(timelines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch timeline for milestone" });
            }
        }

        // GET: api/timeline/independenttask/{independentTaskId}
        [HttpGet("independenttask/{independentTaskId}")]
        public async Task<IActionResult> GetIndependentTaskTimeline(int independentTaskId)
        {
            try
            {
                var timelines = await _timelineService.GetTimelineByIndependentTask(independentTaskId);
                return Ok(timelines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch timeline for independent task" });
            }
        }

        // POST: api/timeline/{timelineId}/dependencies
        [HttpPost("{timelineId}/dependencies")]
        public async Task<IActionResult> AddDependencies(int timelineId, [FromBody] AddDependenciesDto dependencyData)
        {
            if (dependencyData == null || dependencyData.DependencyIds == null)
            {
                return BadRequest(new { error = "Invalid dependency data" });
            }

            try
            {
                var updatedTimeline = await _timelineService.AddDependencies(timelineId, dependencyData);
                if (updatedTimeline == null)
                {
                    return NotFound(new { error = "Timeline not found" });
                }
                return Ok(updatedTimeline);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Invalid dependency data" });
            }
        }

        // POST: api/timeline/{timelineId}/times
        [HttpPost("{timelineId}/times")]
        public async Task<IActionResult> UpdateTimelineTimes(int timelineId, [FromBody] UpdateTimelineTimesDto timeData)
        {
            if (timeData == null)
            {
                return BadRequest(new { error = "Invalid time data" });
            }

            try
            {
                var updatedTimeline = await _timelineService.UpdateTimelineTimes(timelineId, timeData);
                if (updatedTimeline == null)
                {
                    return NotFound(new { error = "Timeline not found" });
                }
                return Ok(updatedTimeline);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update timeline times" });
            }
        }

        // POST: api/timeline/{timelineId}/phases
        [HttpPost("{timelineId}/phases")]
        public async Task<IActionResult> AddPhaseToTimeline(int timelineId, [FromBody] TimelinePhaseDto phaseDto)
        {
            if (phaseDto == null)
            {
                return BadRequest(new { error = "Invalid phase data" });
            }
            //if (!string.IsNullOrEmpty(phaseDto.TaktTime?.ToString()) && !TimeSpan.TryParse(phaseDto.TaktTime.ToString(), out _)) // Line 137
            //{
            //    return BadRequest(new { error = "Invalid taktTime format. Use hh:mm:ss (e.g., '01:00:00' for 1 hour)." });
            //}
            try
            {
                var updatedTimeline = await _timelineService.AddPhaseToTimeline(timelineId, phaseDto);
                if (updatedTimeline == null)
                {
                    return NotFound(new { error = "Timeline not found" });
                }
                return Ok(updatedTimeline);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add phase to timeline", details = ex.Message });
            }
        }

        // PUT: api/timeline/{timelineId}/phases/{phaseId}
        [HttpPut("{timelineId}/phases/{phaseId}")]
        public async Task<IActionResult> UpdatePhase(int timelineId, int phaseId, [FromBody] UpdatePhaseDto phaseDto)
        {
            if (phaseDto == null)
            {
                return BadRequest(new { error = "Invalid phase data" });
            }

            try
            {
                var updatedTimeline = await _timelineService.UpdatePhase(timelineId, phaseId, phaseDto);
                if (updatedTimeline == null)
                {
                    return NotFound(new { error = "Timeline or phase not found" });
                }
                return Ok(updatedTimeline);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update phase" });
            }
        }

        [HttpGet("events")]
        public async Task<IActionResult> GetTimelineEventsByFilters(
        [FromQuery] int? projectId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string userId = null)
        {
            try
            {
                var timelines = await _timelineService.GetTimelineEventsByFilters(projectId, startDate, endDate, userId);
                return Ok(timelines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch filtered timeline events");
                return StatusCode(500, new { error = "Failed to fetch timeline events" });
            }
        }

        //// GET: api/timeline/{timelineId}/time-analysis
        //[HttpGet("{timelineId}/time-analysis")]
        //public async Task<IActionResult> GetTimeAnalysis(int timelineId)
        //{
        //    try
        //    {
        //        var analysis = await _timelineService.GetTimeAnalysis(timelineId);
        //        if (analysis == null)
        //        {
        //            return NotFound(new { error = "Timeline not found" });
        //        }
        //        return Ok(analysis);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = "Failed to get time analysis", details = ex.Message });
        //    }
        //}

        //// GET: api/timeline/projects/{projectId}/time-metrics
        //[HttpGet("projects/{projectId}/time-metrics")]
        //public async Task<IActionResult> GetProjectTimeMetrics(int projectId)
        //{
        //    try
        //    {
        //        var timelines = await _timelineService.GetTimelineByProject(projectId);

        //        var metrics = new
        //        {
        //            TotalTimelines = timelines.Count,
        //            AverageLeadTime = timelines.Where(t => t.LeadTime.HasValue).Average(t => t.LeadTime.Value.TotalHours),
        //            AverageCycleTime = timelines.Where(t => t.CycleTime.HasValue).Average(t => t.CycleTime.Value.TotalHours),
        //            TotalCompletedPhases = timelines.Sum(t => t.Phases.Count(p => p.PhaseStatus == "Completed")),
        //            TotalPhases = timelines.Sum(t => t.Phases.Count)
        //        };

        //        return Ok(metrics);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Failed to fetch project time metrics for projectId {ProjectId}", projectId);
        //        return StatusCode(500, new { error = "Failed to fetch project time metrics" });
        //    }
        //}
    }
}