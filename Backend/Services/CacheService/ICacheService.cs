namespace ProjectManagementSystem1.Services.CacheService
{
    public interface ICacheService
    {
        // Basic Cache Operations
        T? Get<T>(string key);
        Task<T?> GetAsync<T>(string key);
        void Set<T>(string key, T value, TimeSpan? expiry = null);
        Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
        void Remove(string key);
        Task RemoveAsync(string key);
        bool Exists(string key);
        Task<bool> ExistsAsync(string key);

        // Bulk Operations
        void RemoveByPattern(string pattern);
        Task RemoveByPatternAsync(string pattern);
        Dictionary<string, T> GetMultiple<T>(List<string> keys);
        Task<Dictionary<string, T>> GetMultipleAsync<T>(List<string> keys);
        void SetMultiple<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiry = null);
        Task SetMultipleAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiry = null);

        // Cache Statistics
        CacheStatistics GetStatistics();
        Task<CacheStatistics> GetStatisticsAsync();

        // Specific Cache Keys
        void InvalidateUserCache(string userId);
        void InvalidateProjectCache(int projectId);
        void InvalidateTaskCache(int taskId);
        void InvalidateNotificationCache(string userId);
        void InvalidateAllCache();

        // Cache Keys Generation
        string GetUserCacheKey(string userId);
        string GetProjectCacheKey(int projectId);
        string GetTaskCacheKey(int taskId);
        string GetNotificationCacheKey(string userId);
        string GetStatisticsCacheKey(string type);
    }

    public class CacheStatistics
    {
        public int TotalItems { get; set; }
        public long TotalSize { get; set; }
        public int HitCount { get; set; }
        public int MissCount { get; set; }
        public double HitRate => TotalRequests > 0 ? (double)HitCount / TotalRequests : 0;
        public int TotalRequests => HitCount + MissCount;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
