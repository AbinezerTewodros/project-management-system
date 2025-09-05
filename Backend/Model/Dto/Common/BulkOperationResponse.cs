using System.Text.Json.Serialization;

namespace ProjectManagementSystem1.Model.Dto.Common
{
    /// <summary>
    /// Response wrapper for bulk operations that process multiple items
    /// </summary>
    /// <typeparam name="T">The type of data being returned for successful operations</typeparam>
    public class BulkOperationResponse<T>
    {
        /// <summary>
        /// Overall success status of the bulk operation
        /// </summary>
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        /// <summary>
        /// Human-readable message describing the result of the operation
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; }

        /// <summary>
        /// Total number of items processed
        /// </summary>
        [JsonPropertyName("totalProcessed")]
        public int TotalProcessed { get; set; }

        /// <summary>
        /// Number of items that were successfully processed
        /// </summary>
        [JsonPropertyName("successfulCount")]
        public int SuccessfulCount { get; set; }

        /// <summary>
        /// Number of items that failed to process
        /// </summary>
        [JsonPropertyName("failedCount")]
        public int FailedCount { get; set; }

        /// <summary>
        /// Individual results for each item processed
        /// </summary>
        [JsonPropertyName("results")]
        public List<BulkOperationResult<T>> Results { get; set; } = new List<BulkOperationResult<T>>();

        /// <summary>
        /// UTC timestamp when the response was generated
        /// </summary>
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Creates a bulk operation response from a list of individual results
        /// </summary>
        /// <param name="results">List of individual operation results</param>
        /// <param name="message">Optional custom message</param>
        /// <returns>A bulk operation response</returns>
        public static BulkOperationResponse<T> FromResults(List<BulkOperationResult<T>> results, string message = "")
        {
            var successfulCount = results.Count(r => r.Success);
            var failedCount = results.Count(r => !r.Success);

            return new BulkOperationResponse<T>
            {
                Success = failedCount == 0,
                TotalProcessed = results.Count,
                SuccessfulCount = successfulCount,
                FailedCount = failedCount,
                Results = results,
                Message = string.IsNullOrEmpty(message) 
                    ? $"Processed {results.Count} items. {successfulCount} successful, {failedCount} failed."
                    : message
            };
        }
    }

    /// <summary>
    /// Result for a single item in a bulk operation
    /// </summary>
    /// <typeparam name="T">The type of data being returned for successful operations</typeparam>
    public class BulkOperationResult<T>
    {
        /// <summary>
        /// Whether this individual operation was successful
        /// </summary>
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        /// <summary>
        /// The index/position of this item in the original request
        /// </summary>
        [JsonPropertyName("index")]
        public int Index { get; set; }

        /// <summary>
        /// The ID or identifier of the item (if available)
        /// </summary>
        [JsonPropertyName("itemId")]
        public string? ItemId { get; set; }

        /// <summary>
        /// The result data for successful operations
        /// </summary>
        [JsonPropertyName("data")]
        public T? Data { get; set; }

        /// <summary>
        /// Error message if the operation failed
        /// </summary>
        [JsonPropertyName("error")]
        public string? Error { get; set; }

        /// <summary>
        /// Additional error details if available
        /// </summary>
        [JsonPropertyName("errorDetails")]
        public object? ErrorDetails { get; set; }

        /// <summary>
        /// Creates a successful result
        /// </summary>
        /// <param name="index">Index of the item</param>
        /// <param name="data">Result data</param>
        /// <param name="itemId">Optional item ID</param>
        /// <returns>A successful bulk operation result</returns>
        public static BulkOperationResult<T> CreateSuccess(int index, T data, string? itemId = null)
        {
            return new BulkOperationResult<T>
            {
                Success = true,
                Index = index,
                ItemId = itemId,
                Data = data
            };
        }

        /// <summary>
        /// Creates a failed result
        /// </summary>
        /// <param name="index">Index of the item</param>
        /// <param name="error">Error message</param>
        /// <param name="itemId">Optional item ID</param>
        /// <param name="errorDetails">Optional error details</param>
        /// <returns>A failed bulk operation result</returns>
        public static BulkOperationResult<T> CreateFailure(int index, string error, string? itemId = null, object? errorDetails = null)
        {
            return new BulkOperationResult<T>
            {
                Success = false,
                Index = index,
                ItemId = itemId,
                Error = error,
                ErrorDetails = errorDetails
            };
        }
    }
}
