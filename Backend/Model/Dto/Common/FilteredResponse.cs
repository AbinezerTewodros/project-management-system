using System.Text.Json.Serialization;

namespace ProjectManagementSystem1.Model.Dto.Common
{
    /// <summary>
    /// Wrapper for filtered API responses that includes data and filter metadata.
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class FilteredResponse<T>
    {
        /// <summary>
        /// The filtered data items
        /// </summary>
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new List<T>();

        /// <summary>
        /// Information about the applied filters
        /// </summary>
        [JsonPropertyName("filters")]
        public FilterMetadata Filters { get; set; } = new FilterMetadata();

        /// <summary>
        /// Available filter options for the current resource
        /// </summary>
        [JsonPropertyName("availableFilters")]
        public List<FilterOption> AvailableFilters { get; set; } = new List<FilterOption>();

        /// <summary>
        /// Creates a new filtered response with the specified data and filter info
        /// </summary>
        /// <param name="data">The filtered data items</param>
        /// <param name="appliedFilters">The filters that were applied</param>
        /// <param name="availableFilters">Available filter options</param>
        /// <returns>A new filtered response</returns>
        public static FilteredResponse<T> Create(List<T> data, Dictionary<string, object> appliedFilters, List<FilterOption> availableFilters)
        {
            return new FilteredResponse<T>
            {
                Data = data,
                Filters = new FilterMetadata
                {
                    AppliedFilters = appliedFilters,
                    TotalFilteredCount = data.Count
                },
                AvailableFilters = availableFilters
            };
        }
    }

    /// <summary>
    /// Metadata about the applied filters
    /// </summary>
    public class FilterMetadata
    {
        /// <summary>
        /// The filters that were applied to the query
        /// </summary>
        [JsonPropertyName("appliedFilters")]
        public Dictionary<string, object> AppliedFilters { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// Total count of items after applying filters
        /// </summary>
        [JsonPropertyName("totalFilteredCount")]
        public int TotalFilteredCount { get; set; }
    }

    /// <summary>
    /// Represents an available filter option
    /// </summary>
    public class FilterOption
    {
        /// <summary>
        /// The name/key of the filter
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The display name of the filter
        /// </summary>
        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// The type of filter (text, select, date, etc.)
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Available options for select-type filters
        /// </summary>
        [JsonPropertyName("options")]
        public List<FilterOptionValue>? Options { get; set; }

        /// <summary>
        /// Whether this filter is required
        /// </summary>
        [JsonPropertyName("required")]
        public bool Required { get; set; }

        /// <summary>
        /// Default value for the filter
        /// </summary>
        [JsonPropertyName("defaultValue")]
        public object? DefaultValue { get; set; }
    }

    /// <summary>
    /// Represents a filter option value
    /// </summary>
    public class FilterOptionValue
    {
        /// <summary>
        /// The value of the option
        /// </summary>
        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        /// <summary>
        /// The display text for the option
        /// </summary>
        [JsonPropertyName("displayText")]
        public string DisplayText { get; set; } = string.Empty;

        /// <summary>
        /// Count of items that would match this filter option
        /// </summary>
        [JsonPropertyName("count")]
        public int Count { get; set; }
    }
}

