using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProjectManagementSystem1.Configuration;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace ProjectManagementSystem1.Services.Caching
{
    /// <summary>
    /// In-memory cache implementation using IMemoryCache.
    /// </summary>
    public class MemoryCacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<MemoryCacheService> _logger;
        private readonly CacheOptions _options;
        private readonly ConcurrentDictionary<string, object> _cacheKeys = new();
        private readonly ConcurrentDictionary<string, long> _hitCounts = new();
        private readonly ConcurrentDictionary<string, long> _missCounts = new();

        public MemoryCacheService(
            IMemoryCache memoryCache,
            ILogger<MemoryCacheService> logger,
            IOptions<CacheOptions> options)
        {
            _memoryCache = memoryCache;
            _logger = logger;
            _options = options.Value;
        }

        public T? Get<T>(string key)
        {
            if (!_options.EnableCaching)
                return default;

            var fullKey = GetFullKey(key);
            
            if (_memoryCache.TryGetValue(fullKey, out var value))
            {
                IncrementHitCount(key);
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return (T?)value;
            }

            IncrementMissCount(key);
            _logger.LogDebug("Cache miss for key: {Key}", key);
            return default;
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            return await Task.FromResult(Get<T>(key));
        }

        public void Set<T>(string key, T value)
        {
            Set<T>(key, value, _options.DefaultExpirationMinutes);
        }

        public void Set<T>(string key, T value, int expirationMinutes)
        {
            if (!_options.EnableCaching)
                return;

            var fullKey = GetFullKey(key);
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(expirationMinutes),
                Size = GetObjectSize(value)
            };

            _memoryCache.Set(fullKey, value, options);
            _cacheKeys.TryAdd(fullKey, value);
            
            _logger.LogDebug("Cached value for key: {Key} with expiration: {Expiration} minutes", key, expirationMinutes);
        }

        public async Task SetAsync<T>(string key, T value)
        {
            await Task.Run(() => Set(key, value));
        }

        public async Task SetAsync<T>(string key, T value, int expirationMinutes)
        {
            await Task.Run(() => Set(key, value, expirationMinutes));
        }

        public void Remove(string key)
        {
            if (!_options.EnableCaching)
                return;

            var fullKey = GetFullKey(key);
            _memoryCache.Remove(fullKey);
            _cacheKeys.TryRemove(fullKey, out _);
            
            _logger.LogDebug("Removed cache entry for key: {Key}", key);
        }

        public async Task RemoveAsync(string key)
        {
            await Task.Run(() => Remove(key));
        }

        public void RemoveByPattern(string pattern)
        {
            if (!_options.EnableCaching)
                return;

            var regex = new Regex(pattern.Replace("*", ".*"));
            var keysToRemove = _cacheKeys.Keys
                .Where(k => regex.IsMatch(k))
                .ToList();

            foreach (var key in keysToRemove)
            {
                _memoryCache.Remove(key);
                _cacheKeys.TryRemove(key, out _);
            }

            _logger.LogDebug("Removed {Count} cache entries matching pattern: {Pattern}", keysToRemove.Count, pattern);
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            await Task.Run(() => RemoveByPattern(pattern));
        }

        public void Clear()
        {
            if (!_options.EnableCaching)
                return;

            var keys = _cacheKeys.Keys.ToList();
            foreach (var key in keys)
            {
                _memoryCache.Remove(key);
            }
            _cacheKeys.Clear();
            
            _logger.LogInformation("Cleared all cache entries ({Count} entries)", keys.Count);
        }

        public async Task ClearAsync()
        {
            await Task.Run(() => Clear());
        }

        public T GetOrSet<T>(string key, Func<T> factory, int? expirationMinutes = null)
        {
            var cachedValue = Get<T>(key);
            if (cachedValue != null)
                return cachedValue;

            var value = factory();
            Set(key, value, expirationMinutes ?? _options.DefaultExpirationMinutes);
            return value;
        }

        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, int? expirationMinutes = null)
        {
            var cachedValue = await GetAsync<T>(key);
            if (cachedValue != null)
                return cachedValue;

            var value = await factory();
            await SetAsync(key, value, expirationMinutes ?? _options.DefaultExpirationMinutes);
            return value;
        }

        public bool Exists(string key)
        {
            if (!_options.EnableCaching)
                return false;

            var fullKey = GetFullKey(key);
            return _memoryCache.TryGetValue(fullKey, out _);
        }

        public async Task<bool> ExistsAsync(string key)
        {
            return await Task.FromResult(Exists(key));
        }

        public CacheStatistics GetStatistics()
        {
            var totalHits = _hitCounts.Values.Sum();
            var totalMisses = _missCounts.Values.Sum();
            var memoryUsage = GC.GetTotalMemory(false);

            return new CacheStatistics
            {
                TotalEntries = _cacheKeys.Count,
                MemoryUsageBytes = memoryUsage,
                HitCount = totalHits,
                MissCount = totalMisses,
                Provider = "Memory",
                CollectedAt = DateTime.UtcNow
            };
        }

        public async Task<CacheStatistics> GetStatisticsAsync()
        {
            return await Task.FromResult(GetStatistics());
        }

        private string GetFullKey(string key)
        {
            return $"{_options.KeyPrefix}{key}";
        }

        private void IncrementHitCount(string key)
        {
            _hitCounts.AddOrUpdate(key, 1, (k, v) => v + 1);
        }

        private void IncrementMissCount(string key)
        {
            _missCounts.AddOrUpdate(key, 1, (k, v) => v + 1);
        }

        private long GetObjectSize<T>(T obj)
        {
            if (obj == null)
                return 0;

            try
            {
                // Simple size estimation - in production, you might want a more sophisticated approach
                var json = System.Text.Json.JsonSerializer.Serialize(obj);
                return System.Text.Encoding.UTF8.GetByteCount(json);
            }
            catch
            {
                // Fallback to a default size if serialization fails
                return 1024; // 1KB default
            }
        }
    }
}

