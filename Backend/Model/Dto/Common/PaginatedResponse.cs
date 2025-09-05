using System.Text.Json.Serialization;

namespace ProjectManagementSystem1.Model.Dto.Common
{
    /// <summary>
    /// Wrapper for paginated API responses that includes data and pagination metadata.
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class PaginatedResponse<T>
    {
        /// <summary>
        /// The actual data items for the current page
        /// </summary>
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new List<T>();

        /// <summary>
        /// Pagination metadata including current page, total pages, etc.
        /// </summary>
        [JsonPropertyName("pagination")]
        public PaginationMetadata Pagination { get; set; } = new PaginationMetadata();

        /// <summary>
        /// Navigation links for pagination (first, previous, next, last)
        /// </summary>
        [JsonPropertyName("links")]
        public PaginationLinks Links { get; set; } = new PaginationLinks();

        /// <summary>
        /// Creates a new paginated response with the specified data and pagination info
        /// </summary>
        /// <param name="data">The data items for the current page</param>
        /// <param name="pageNumber">Current page number</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <param name="totalCount">Total number of items across all pages</param>
        /// <param name="baseUrl">Base URL for generating navigation links</param>
        /// <returns>A new paginated response</returns>
        public static PaginatedResponse<T> Create(List<T> data, int pageNumber, int pageSize, int totalCount, string baseUrl)
        {
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            
            return new PaginatedResponse<T>
            {
                Data = data,
                Pagination = new PaginationMetadata
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasPreviousPage = pageNumber > 1,
                    HasNextPage = pageNumber < totalPages
                },
                Links = new PaginationLinks
                {
                    First = $"{baseUrl}?pageNumber=1&pageSize={pageSize}",
                    Previous = pageNumber > 1 ? $"{baseUrl}?pageNumber={pageNumber - 1}&pageSize={pageSize}" : null,
                    Next = pageNumber < totalPages ? $"{baseUrl}?pageNumber={pageNumber + 1}&pageSize={pageSize}" : null,
                    Last = $"{baseUrl}?pageNumber={totalPages}&pageSize={pageSize}"
                }
            };
        }
    }

    /// <summary>
    /// Metadata about the pagination including current page, total pages, etc.
    /// </summary>
    public class PaginationMetadata
    {
        /// <summary>
        /// Current page number (1-based)
        /// </summary>
        [JsonPropertyName("pageNumber")]
        public int PageNumber { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of items across all pages
        /// </summary>
        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }

        /// <summary>
        /// Whether there is a previous page available
        /// </summary>
        [JsonPropertyName("hasPreviousPage")]
        public bool HasPreviousPage { get; set; }

        /// <summary>
        /// Whether there is a next page available
        /// </summary>
        [JsonPropertyName("hasNextPage")]
        public bool HasNextPage { get; set; }
    }

    /// <summary>
    /// Navigation links for pagination
    /// </summary>
    public class PaginationLinks
    {
        /// <summary>
        /// Link to the first page
        /// </summary>
        [JsonPropertyName("first")]
        public string First { get; set; } = string.Empty;

        /// <summary>
        /// Link to the previous page (null if no previous page)
        /// </summary>
        [JsonPropertyName("previous")]
        public string? Previous { get; set; }

        /// <summary>
        /// Link to the next page (null if no next page)
        /// </summary>
        [JsonPropertyName("next")]
        public string? Next { get; set; }

        /// <summary>
        /// Link to the last page
        /// </summary>
        [JsonPropertyName("last")]
        public string Last { get; set; } = string.Empty;
    }
}

