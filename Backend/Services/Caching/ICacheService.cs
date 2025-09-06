namespace ProjectManagementSystem1.Services.Caching
{
    /// <summary>
    /// Service for managing application caching operations.
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Gets a value from cache by key.
        /// </summary>
        /// <typeparam name="T">Type of the cached value</typeparam>
        /// <param name="key">Cache key</param>
        /// <returns>Cached value or null if not found</returns>
        T? Get<T>(string key);

        /// <summary>
        /// Gets a value from cache by key asynchronously.
        /// </summary>
        /// <typeparam name="T">Type of the cached value</typeparam>
        /// <param name="key">Cache key</param>
        /// <returns>Cached value or null if not found</returns>
        Task<T?> GetAsync<T>(string key);

        /// <summary>
        /// Sets a value in cache with default expiration.
        /// </summary>
        /// <typeparam name="T">Type of the value to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        void Set<T>(string key, T value);

        /// <summary>
        /// Sets a value in cache with custom expiration.
        /// </summary>
        /// <typeparam name="T">Type of the value to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="expirationMinutes">Expiration time in minutes</param>
        void Set<T>(string key, T value, int expirationMinutes);

        /// <summary>
        /// Sets a value in cache asynchronously with default expiration.
        /// </summary>
        /// <typeparam name="T">Type of the value to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        Task SetAsync<T>(string key, T value);

        /// <summary>
        /// Sets a value in cache asynchronously with custom expiration.
        /// </summary>
        /// <typeparam name="T">Type of the value to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="expirationMinutes">Expiration time in minutes</param>
        Task SetAsync<T>(string key, T value, int expirationMinutes);

        /// <summary>
        /// Removes a value from cache by key.
        /// </summary>
        /// <param name="key">Cache key to remove</param>
        void Remove(string key);

        /// <summary>
        /// Removes a value from cache by key asynchronously.
        /// </summary>
        /// <param name="key">Cache key to remove</param>
        Task RemoveAsync(string key);

        /// <summary>
        /// Removes all cache entries that match the pattern.
        /// </summary>
        /// <param name="pattern">Pattern to match keys</param>
        void RemoveByPattern(string pattern);

        /// <summary>
        /// Removes all cache entries that match the pattern asynchronously.
        /// </summary>
        /// <param name="pattern">Pattern to match keys</param>
        Task RemoveByPatternAsync(string pattern);

        /// <summary>
        /// Clears all cache entries.
        /// </summary>
        void Clear();

        /// <summary>
        /// Clears all cache entries asynchronously.
        /// </summary>
        Task ClearAsync();

        /// <summary>
        /// Gets or sets a value in cache, using the factory if not found.
        /// </summary>
        /// <typeparam name="T">Type of the cached value</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="factory">Factory function to create value if not cached</param>
        /// <param name="expirationMinutes">Expiration time in minutes</param>
        /// <returns>Cached or newly created value</returns>
        T GetOrSet<T>(string key, Func<T> factory, int? expirationMinutes = null);

        /// <summary>
        /// Gets or sets a value in cache asynchronously, using the factory if not found.
        /// </summary>
        /// <typeparam name="T">Type of the cached value</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="factory">Factory function to create value if not cached</param>
        /// <param name="expirationMinutes">Expiration time in minutes</param>
        /// <returns>Cached or newly created value</returns>
        Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, int? expirationMinutes = null);

        /// <summary>
        /// Checks if a key exists in cache.
        /// </summary>
        /// <param name="key">Cache key to check</param>
        /// <returns>True if key exists, false otherwise</returns>
        bool Exists(string key);

        /// <summary>
        /// Checks if a key exists in cache asynchronously.
        /// </summary>
        /// <param name="key">Cache key to check</param>
        /// <returns>True if key exists, false otherwise</returns>
        Task<bool> ExistsAsync(string key);

        /// <summary>
        /// Gets cache statistics.
        /// </summary>
        /// <returns>Cache statistics</returns>
        CacheStatistics GetStatistics();

        /// <summary>
        /// Gets cache statistics asynchronously.
        /// </summary>
        /// <returns>Cache statistics</returns>
        Task<CacheStatistics> GetStatisticsAsync();
    }

    /// <summary>
    /// Cache statistics information.
    /// </summary>
    public class CacheStatistics
    {
        /// <summary>
        /// Total number of cache entries
        /// </summary>
        public long TotalEntries { get; set; }

        /// <summary>
        /// Total memory usage in bytes
        /// </summary>
        public long MemoryUsageBytes { get; set; }

        /// <summary>
        /// Cache hit count
        /// </summary>
        public long HitCount { get; set; }

        /// <summary>
        /// Cache miss count
        /// </summary>
        public long MissCount { get; set; }

        /// <summary>
        /// Cache hit ratio (0-1)
        /// </summary>
        public double HitRatio => TotalRequests > 0 ? (double)HitCount / TotalRequests : 0;

        /// <summary>
        /// Total requests (hits + misses)
        /// </summary>
        public long TotalRequests => HitCount + MissCount;

        /// <summary>
        /// Cache provider name
        /// </summary>
        public string Provider { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when statistics were collected
        /// </summary>
        public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
    }
}

