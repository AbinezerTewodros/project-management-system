namespace ProjectManagementSystem1.Configuration
{
    /// <summary>
    /// Configuration options for caching behavior.
    /// </summary>
    public class CacheOptions
    {
        /// <summary>
        /// Whether caching is enabled
        /// </summary>
        public bool EnableCaching { get; set; } = true;

        /// <summary>
        /// Default cache expiration time in minutes
        /// </summary>
        public int DefaultExpirationMinutes { get; set; } = 30;

        /// <summary>
        /// Maximum cache size in MB
        /// </summary>
        public int MaxCacheSizeMB { get; set; } = 100;

        /// <summary>
        /// Whether to enable cache compression
        /// </summary>
        public bool EnableCompression { get; set; } = false;

        /// <summary>
        /// Cache provider to use (Memory, Redis)
        /// </summary>
        public string Provider { get; set; } = "Memory";

        /// <summary>
        /// Redis connection string (if using Redis)
        /// </summary>
        public string? RedisConnectionString { get; set; }

        /// <summary>
        /// Whether to enable cache monitoring
        /// </summary>
        public bool EnableMonitoring { get; set; } = true;

        /// <summary>
        /// Cache key prefix for namespacing
        /// </summary>
        public string KeyPrefix { get; set; } = "PMS:";

        /// <summary>
        /// Whether to enable cache invalidation on entity changes
        /// </summary>
        public bool EnableInvalidation { get; set; } = true;

        /// <summary>
        /// Cache entry size limit in bytes
        /// </summary>
        public int MaxEntrySizeBytes { get; set; } = 1024 * 1024; // 1MB
    }
}

