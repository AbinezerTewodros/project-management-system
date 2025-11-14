using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProjectManagementSystem1.Configuration;

namespace ProjectManagementSystem1.Services.Caching
{
    /// <summary>
    /// Implementation of cache invalidation service.
    /// </summary>
    public class CacheInvalidationService : ICacheInvalidationService
    {
        private readonly ICacheService _cacheService;
        private readonly ILogger<CacheInvalidationService> _logger;
        private readonly CacheOptions _options;

        public CacheInvalidationService(
            ICacheService cacheService,
            ILogger<CacheInvalidationService> logger,
            IOptions<CacheOptions> options)
        {
            _cacheService = cacheService;
            _logger = logger;
            _options = options.Value;
        }

        public async Task InvalidateEntityTypeAsync(string entityType)
        {
            if (!_options.EnableInvalidation)
                return;

            var pattern = $"*{entityType}*";
            await _cacheService.RemoveByPatternAsync(pattern);
            
            _logger.LogInformation("Invalidated cache for entity type: {EntityType}", entityType);
        }

        public async Task InvalidateEntityAsync(string entityType, object entityId)
        {
            if (!_options.EnableInvalidation)
                return;

            var patterns = new[]
            {
                $"*{entityType}:{entityId}*",
                $"*{entityType}*{entityId}*",
                $"*{entityId}*{entityType}*"
            };

            foreach (var pattern in patterns)
            {
                await _cacheService.RemoveByPatternAsync(pattern);
            }
            
            _logger.LogInformation("Invalidated cache for entity: {EntityType}:{EntityId}", entityType, entityId);
        }

        public async Task InvalidateUserAsync(string userId)
        {
            if (!_options.EnableInvalidation)
                return;

            var patterns = new[]
            {
                $"*user:{userId}*",
                $"*User:{userId}*",
                $"*{userId}*user*",
                $"*{userId}*User*"
            };

            foreach (var pattern in patterns)
            {
                await _cacheService.RemoveByPatternAsync(pattern);
            }
            
            _logger.LogInformation("Invalidated cache for user: {UserId}", userId);
        }

        public async Task InvalidateProjectAsync(int projectId)
        {
            if (!_options.EnableInvalidation)
                return;

            var patterns = new[]
            {
                $"*project:{projectId}*",
                $"*Project:{projectId}*",
                $"*{projectId}*project*",
                $"*{projectId}*Project*",
                $"*projects*{projectId}*",
                $"*Projects*{projectId}*"
            };

            foreach (var pattern in patterns)
            {
                await _cacheService.RemoveByPatternAsync(pattern);
            }
            
            _logger.LogInformation("Invalidated cache for project: {ProjectId}", projectId);
        }

        public async Task InvalidateTaskAsync(int taskId)
        {
            if (!_options.EnableInvalidation)
                return;

            var patterns = new[]
            {
                $"*task:{taskId}*",
                $"*Task:{taskId}*",
                $"*{taskId}*task*",
                $"*{taskId}*Task*",
                $"*tasks*{taskId}*",
                $"*Tasks*{taskId}*"
            };

            foreach (var pattern in patterns)
            {
                await _cacheService.RemoveByPatternAsync(pattern);
            }
            
            _logger.LogInformation("Invalidated cache for task: {TaskId}", taskId);
        }

        public async Task InvalidateAllAsync()
        {
            if (!_options.EnableInvalidation)
                return;

            await _cacheService.ClearAsync();
            _logger.LogInformation("Invalidated all cache entries");
        }

        public async Task InvalidateByPatternAsync(string pattern)
        {
            if (!_options.EnableInvalidation)
                return;

            await _cacheService.RemoveByPatternAsync(pattern);
            _logger.LogInformation("Invalidated cache entries matching pattern: {Pattern}", pattern);
        }
    }
}

