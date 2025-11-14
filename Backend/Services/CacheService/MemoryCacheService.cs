using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ProjectManagementSystem1.Services.CacheService
{

   
        public class MemoryCacheService : ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<MemoryCacheService> _logger;
        private readonly Dictionary<string, int> _hitCount = new();
        private readonly Dictionary<string, int> _missCount = new();

        public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        #region Basic Cache Operations

        public T? Get<T>(string key)
        {
            try
            {
                if (_cache.TryGetValue(key, out T? value))
                {
                    IncrementHitCount(key);
                    _logger.LogDebug($"Cache hit for key: {key}");
                    return value;
                }
                else
                {
                    IncrementMissCount(key);
                    _logger.LogDebug($"Cache miss for key: {key}");
                    return default;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache value for key: {key}");
                return default;
            }
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            return await Task.FromResult(Get<T>(key));
        }

        public void Set<T>(string key, T value, TimeSpan? expiry = null)
        {
            try
            {
                var options = new MemoryCacheEntryOptions();
                if (expiry.HasValue)
                {
                    options.AbsoluteExpirationRelativeToNow = expiry;
                }

                _cache.Set(key, value, options);
                _logger.LogDebug($"Cache set for key: {key}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache value for key: {key}");
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            await Task.Run(() => Set(key, value, expiry));
        }

        public void Remove(string key)
        {
            try
            {
                _cache.Remove(key);
                _logger.LogDebug($"Cache removed for key: {key}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing cache value for key: {key}");
            }
        }

        public async Task RemoveAsync(string key)
        {
            await Task.Run(() => Remove(key));
        }

        public bool Exists(string key)
        {
            return _cache.TryGetValue(key, out _);
        }

        public async Task<bool> ExistsAsync(string key)
        {
            return await Task.FromResult(Exists(key));
        }

        #endregion

        #region Bulk Operations

        public void RemoveByPattern(string pattern)
        {
            // Note: MemoryCache doesn't support pattern-based removal
            // This is a simplified implementation
            _logger.LogWarning($"Pattern-based cache removal not supported in MemoryCache. Pattern: {pattern}");
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            await Task.Run(() => RemoveByPattern(pattern));
        }

        public Dictionary<string, T> GetMultiple<T>(List<string> keys)
        {
            var result = new Dictionary<string, T>();
            foreach (var key in keys)
            {
                var value = Get<T>(key);
                if (value != null)
                {
                    result[key] = value;
                }
            }
            return result;
        }

        public async Task<Dictionary<string, T>> GetMultipleAsync<T>(List<string> keys)
        {
            return await Task.FromResult(GetMultiple<T>(keys));
        }

        public void SetMultiple<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiry = null)
        {
            foreach (var kvp in keyValuePairs)
            {
                Set(kvp.Key, kvp.Value, expiry);
            }
        }

        public async Task SetMultipleAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiry = null)
        {
            await Task.Run(() => SetMultiple(keyValuePairs, expiry));
        }

        #endregion

        #region Cache Statistics

        public CacheStatistics GetStatistics()
        {
            var totalHits = _hitCount.Values.Sum();
            var totalMisses = _missCount.Values.Sum();

            return new CacheStatistics
            {
                TotalItems = 0, // MemoryCache doesn't provide count information
                TotalSize = 0, // MemoryCache doesn't provide size information
                HitCount = totalHits,
                MissCount = totalMisses,
                LastUpdated = DateTime.UtcNow
            };
        }

        public async Task<CacheStatistics> GetStatisticsAsync()
        {
            return await Task.FromResult(GetStatistics());
        }

        #endregion

        #region Specific Cache Keys

        public void InvalidateUserCache(string userId)
        {
            var key = GetUserCacheKey(userId);
            Remove(key);
            _logger.LogInformation($"Invalidated user cache for user: {userId}");
        }

        public void InvalidateProjectCache(int projectId)
        {
            var key = GetProjectCacheKey(projectId);
            Remove(key);
            _logger.LogInformation($"Invalidated project cache for project: {projectId}");
        }

        public void InvalidateTaskCache(int taskId)
        {
            var key = GetTaskCacheKey(taskId);
            Remove(key);
            _logger.LogInformation($"Invalidated task cache for task: {taskId}");
        }

        public void InvalidateNotificationCache(string userId)
        {
            var key = GetNotificationCacheKey(userId);
            Remove(key);
            _logger.LogInformation($"Invalidated notification cache for user: {userId}");
        }

        public void InvalidateAllCache()
        {
            // Note: MemoryCache doesn't support clearing all entries
            // This is a simplified implementation
            _logger.LogWarning("MemoryCache doesn't support clearing all entries");
        }

        #endregion

        #region Cache Keys Generation

        public string GetUserCacheKey(string userId)
        {
            return $"user:{userId}";
        }

        public string GetProjectCacheKey(int projectId)
        {
            return $"project:{projectId}";
        }

        public string GetTaskCacheKey(int taskId)
        {
            return $"task:{taskId}";
        }

        public string GetNotificationCacheKey(string userId)
        {
            return $"notifications:{userId}";
        }

        public string GetStatisticsCacheKey(string type)
        {
            return $"statistics:{type}";
        }

        #endregion

        #region Private Methods

        private void IncrementHitCount(string key)
        {
            lock (_hitCount)
            {
                if (!_hitCount.ContainsKey(key))
                {
                    _hitCount[key] = 0;
                }
                _hitCount[key]++;
            }
        }

        private void IncrementMissCount(string key)
        {
            lock (_missCount)
            {
                if (!_missCount.ContainsKey(key))
                {
                    _missCount[key] = 0;
                }
                _missCount[key]++;
            }
        }

        #endregion
    }
}
