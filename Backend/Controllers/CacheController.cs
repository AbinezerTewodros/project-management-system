using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services.CacheService;

namespace ProjectManagementSystem1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")]
    public class CacheController : ControllerBase
    {
        private readonly ICacheService _cacheService;
        private readonly ILogger<CacheController> _logger;

        public CacheController(ICacheService cacheService, ILogger<CacheController> logger)
        {
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var statistics = await _cacheService.GetStatisticsAsync();
                return Ok(new { success = true, data = statistics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache statistics");
                return StatusCode(500, new { success = false, message = "Error retrieving cache statistics" });
            }
        }

        [HttpPost("set")]
        public async Task<IActionResult> SetCache([FromBody] SetCacheRequest request)
        {
            try
            {
                await _cacheService.SetAsync(request.Key, request.Value, request.Expiry);
                return Ok(new { success = true, message = "Cache value set successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache value");
                return StatusCode(500, new { success = false, message = "Error setting cache value" });
            }
        }

        [HttpGet("get/{key}")]
        public async Task<IActionResult> GetCache(string key)
        {
            try
            {
                var value = await _cacheService.GetAsync<object>(key);
                return Ok(new { success = true, data = value });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache value");
                return StatusCode(500, new { success = false, message = "Error getting cache value" });
            }
        }

        [HttpDelete("remove/{key}")]
        public async Task<IActionResult> RemoveCache(string key)
        {
            try
            {
                await _cacheService.RemoveAsync(key);
                return Ok(new { success = true, message = "Cache value removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cache value");
                return StatusCode(500, new { success = false, message = "Error removing cache value" });
            }
        }

        [HttpPost("clear")]
        public async Task<IActionResult> ClearCache([FromBody] ClearCacheRequest request)
        {
            try
            {
                if (request.CacheType == "UserCache" && !string.IsNullOrEmpty(request.Key))
                {
                    _cacheService.InvalidateUserCache(request.Key);
                }
                else if (request.CacheType == "ProjectCache" && !string.IsNullOrEmpty(request.Key))
                {
                    if (int.TryParse(request.Key, out int projectId))
                    {
                        _cacheService.InvalidateProjectCache(projectId);
                    }
                }
                else if (request.CacheType == "TaskCache" && !string.IsNullOrEmpty(request.Key))
                {
                    if (int.TryParse(request.Key, out int taskId))
                    {
                        _cacheService.InvalidateTaskCache(taskId);
                    }
                }
                else if (request.CacheType == "NotificationCache" && !string.IsNullOrEmpty(request.Key))
                {
                    _cacheService.InvalidateNotificationCache(request.Key);
                }
                else
                {
                    _cacheService.InvalidateAllCache();
                }

                return Ok(new { success = true, message = "Cache cleared successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cache");
                return StatusCode(500, new { success = false, message = "Error clearing cache" });
            }
        }

        [HttpPost("clear-all")]
        public async Task<IActionResult> ClearAllCache()
        {
            try
            {
                _cacheService.InvalidateAllCache();
                return Ok(new { success = true, message = "All cache cleared successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing all cache");
                return StatusCode(500, new { success = false, message = "Error clearing all cache" });
            }
        }

        [HttpGet("exists/{key}")]
        public async Task<IActionResult> CheckExists(string key)
        {
            try
            {
                var exists = await _cacheService.ExistsAsync(key);
                return Ok(new { success = true, data = new { key, exists } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking cache existence");
                return StatusCode(500, new { success = false, message = "Error checking cache existence" });
            }
        }
    }

    public class SetCacheRequest
    {
        public string Key { get; set; } = string.Empty;
        public object Value { get; set; } = new();
        public TimeSpan? Expiry { get; set; }
    }

    public class ClearCacheRequest
    {
        public string CacheType { get; set; } = string.Empty;
        public string? Key { get; set; }
    }
}

