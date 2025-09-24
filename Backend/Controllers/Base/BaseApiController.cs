using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Exceptions;
using System.Security.Claims;

namespace ProjectManagementSystem1.Controllers.Base
{
    /// <summary>
    /// Base controller that provides common functionality for all API controllers.
    /// Eliminates code duplication and provides consistent patterns.
    /// </summary>
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        protected readonly ILogger _logger;

        protected BaseApiController(ILogger logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validates that an ID parameter is valid (greater than 0).
        /// </summary>
        /// <param name="id">The ID to validate</param>
        /// <param name="resourceName">The name of the resource for error messages</param>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult ValidateId(int id, string resourceName = "Resource")
        {
            if (id <= 0)
            {
                return BadRequest(ApiResponse.CreateError($"Invalid {resourceName.ToLower()} ID"));
            }
            return null;
        }

        /// <summary>
        /// Validates that a string parameter is not null or whitespace.
        /// </summary>
        /// <param name="value">The string to validate</param>
        /// <param name="parameterName">The name of the parameter for error messages</param>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult ValidateRequiredString(string value, string parameterName)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return BadRequest(ApiResponse.CreateError($"{parameterName} is required"));
            }
            return null;
        }

        /// <summary>
        /// Validates ModelState and returns appropriate error response if invalid.
        /// </summary>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult ValidateModelState()
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse.CreateError("Validation failed", errors));
            }
            return null;
        }

        /// <summary>
        /// Gets the current user's ID from claims.
        /// </summary>
        /// <returns>The user ID or null if not found</returns>
        protected string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        /// <summary>
        /// Gets the current user's name from claims.
        /// </summary>
        /// <returns>The username or null if not found</returns>
        protected string GetCurrentUserName()
        {
            return User.FindFirstValue(ClaimTypes.Name);
        }

        /// <summary>
        /// Gets the current user's department from claims.
        /// </summary>
        /// <returns>The department or null if not found</returns>
        protected string GetCurrentUserDepartment()
        {
            return User.FindFirst("Department")?.Value;
        }

        /// <summary>
        /// Validates that the current user has a department claim.
        /// </summary>
        /// <returns>Forbid result if no department claim, null if valid</returns>
        protected IActionResult ValidateUserDepartment()
        {
            var department = GetCurrentUserDepartment();
            if (string.IsNullOrEmpty(department))
            {
                _logger.LogWarning("User {UserId} attempted to access resource without department claim", 
                    GetCurrentUserId());
                return Forbid();
            }
            return null;
        }

        /// <summary>
        /// Validates that the current user is authenticated.
        /// </summary>
        /// <returns>Unauthorized result if not authenticated, null if valid</returns>
        protected IActionResult ValidateUserAuthenticated()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.CreateError("User not authenticated"));
            }
            return null;
        }

        /// <summary>
        /// Creates a standardized success response.
        /// </summary>
        /// <typeparam name="T">The type of data being returned</typeparam>
        /// <param name="data">The data to include in the response</param>
        /// <param name="message">The success message</param>
        /// <returns>Ok result with standardized response</returns>
        protected IActionResult SuccessResponse<T>(T data, string message)
        {
            return Ok(ApiResponse<T>.CreateSuccess(data, message));
        }

        /// <summary>
        /// Creates a standardized success response without data.
        /// </summary>
        /// <param name="message">The success message</param>
        /// <returns>Ok result with standardized response</returns>
        protected IActionResult SuccessResponse(string message)
        {
            return Ok(ApiResponse.CreateSuccess(message));
        }

        /// <summary>
        /// Creates a standardized error response.
        /// </summary>
        /// <param name="message">The error message</param>
        /// <param name="errors">Optional list of detailed errors</param>
        /// <returns>BadRequest result with standardized response</returns>
        protected IActionResult ErrorResponse(string message, List<string> errors = null)
        {
            return BadRequest(ApiResponse.CreateError(message, errors));
        }

        /// <summary>
        /// Creates a standardized error response from an exception.
        /// </summary>
        /// <param name="ex">The exception</param>
        /// <param name="message">The error message</param>
        /// <returns>BadRequest result with standardized response</returns>
        protected IActionResult ErrorResponse(Exception ex, string message)
        {
            return BadRequest(ApiResponse.CreateError(message, new List<string> { ex.Message }));
        }

        /// <summary>
        /// Creates a standardized validation error response from ModelState.
        /// </summary>
        /// <param name="modelState">The ModelState containing validation errors</param>
        /// <returns>BadRequest result with standardized response</returns>
        protected IActionResult ValidationErrorResponse(Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary modelState)
        {
            var errors = modelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.CreateError("Validation failed", errors));
        }

        /// <summary>
        /// Creates a standardized unauthorized response.
        /// </summary>
        /// <param name="message">The unauthorized message</param>
        /// <returns>Unauthorized result with standardized response</returns>
        protected IActionResult UnauthorizedResponse(string message)
        {
            return Unauthorized(ApiResponse.CreateError(message));
        }

        /// <summary>
        /// Creates a standardized bad request response.
        /// </summary>
        /// <param name="message">The bad request message</param>
        /// <returns>BadRequest result with standardized response</returns>
        protected IActionResult BadRequestResponse(string message)
        {
            return BadRequest(ApiResponse.CreateError(message));
        }

        /// <summary>
        /// Creates a standardized not found response.
        /// </summary>
        /// <param name="resourceName">The name of the resource</param>
        /// <param name="id">The ID that was not found</param>
        /// <returns>NotFound result with standardized response</returns>
        protected IActionResult NotFoundResponse(string resourceName, int id)
        {
            return NotFound(ApiResponse.CreateError($"{resourceName} with ID {id} was not found"));
        }

        /// <summary>
        /// Creates a standardized not found response with custom message.
        /// </summary>
        /// <param name="message">The not found message</param>
        /// <returns>NotFound result with standardized response</returns>
        protected IActionResult NotFoundResponse(string message)
        {
            return NotFound(ApiResponse.CreateError(message));
        }

        /// <summary>
        /// Creates a standardized internal server error response.
        /// </summary>
        /// <param name="message">The error message</param>
        /// <returns>StatusCode 500 result with standardized response</returns>
        protected IActionResult InternalServerErrorResponse(string message)
        {
            return StatusCode(500, ApiResponse.CreateError(message));
        }

        /// <summary>
        /// Handles common exceptions and returns appropriate responses.
        /// </summary>
        /// <param name="ex">The exception to handle</param>
        /// <param name="operation">The operation being performed (for logging)</param>
        /// <param name="resourceId">The resource ID (for logging)</param>
        /// <returns>Appropriate error response</returns>
        protected IActionResult HandleException(Exception ex, string operation, int? resourceId = null)
        {
            return ex switch
            {
                ValidationException validationEx => ErrorResponse("Validation failed", new List<string> { validationEx.Message }),
                NotFoundException notFoundEx => NotFoundResponse(notFoundEx.Message),
                System.UnauthorizedAccessException => Forbid(),
                _ => HandleUnexpectedException(ex, operation, resourceId)
            };
        }

        /// <summary>
        /// Handles unexpected exceptions with logging.
        /// </summary>
        /// <param name="ex">The exception to handle</param>
        /// <param name="operation">The operation being performed</param>
        /// <param name="resourceId">The resource ID</param>
        /// <returns>Internal server error response</returns>
        private IActionResult HandleUnexpectedException(Exception ex, string operation, int? resourceId)
        {
            var logMessage = resourceId.HasValue 
                ? $"Error {operation} for resource {resourceId.Value}"
                : $"Error {operation}";

            _logger.LogError(ex, logMessage);
            return InternalServerErrorResponse($"An error occurred while {operation.ToLower()}");
        }

        /// <summary>
        /// Validates pagination parameters.
        /// </summary>
        /// <param name="pageNumber">The page number</param>
        /// <param name="pageSize">The page size</param>
        /// <param name="maxPageSize">The maximum allowed page size</param>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult ValidatePagination(int pageNumber, int pageSize, int maxPageSize = 100)
        {
            if (pageNumber < 1)
            {
                return BadRequest(ApiResponse.CreateError("Page number must be greater than 0"));
            }

            if (pageSize < 1 || pageSize > maxPageSize)
            {
                return BadRequest(ApiResponse.CreateError($"Page size must be between 1 and {maxPageSize}"));
            }

            return null;
        }

        /// <summary>
        /// Validates that a value is in a list of allowed values.
        /// </summary>
        /// <param name="value">The value to validate</param>
        /// <param name="allowedValues">The list of allowed values</param>
        /// <param name="parameterName">The name of the parameter for error messages</param>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult ValidateEnumValue(string value, string[] allowedValues, string parameterName)
        {
            if (!allowedValues.Contains(value, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(ApiResponse.CreateError($"{parameterName} must be one of: {string.Join(", ", allowedValues)}"));
            }
            return null;
        }

        /// <summary>
        /// Creates a paginated response with the specified data and pagination info.
        /// </summary>
        /// <typeparam name="T">The type of data being returned</typeparam>
        /// <param name="data">The data items for the current page</param>
        /// <param name="pageNumber">Current page number</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <param name="totalCount">Total number of items across all pages</param>
        /// <param name="message">Success message</param>
        /// <returns>Ok result with paginated response</returns>
        protected IActionResult CreatePaginatedResponse<T>(List<T> data, int pageNumber, int pageSize, int totalCount, string message = "Data retrieved successfully")
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.Path}";
            var paginatedData = PaginatedResponse<T>.Create(data, pageNumber, pageSize, totalCount, baseUrl);
            return Ok(ApiResponse<PaginatedResponse<T>>.CreateSuccess(paginatedData, message));
        }

        /// <summary>
        /// Creates a filtered response with the specified data and filter info.
        /// </summary>
        /// <typeparam name="T">The type of data being returned</typeparam>
        /// <param name="data">The filtered data items</param>
        /// <param name="appliedFilters">The filters that were applied</param>
        /// <param name="availableFilters">Available filter options</param>
        /// <param name="message">Success message</param>
        /// <returns>Ok result with filtered response</returns>
        protected IActionResult CreateFilteredResponse<T>(List<T> data, Dictionary<string, object> appliedFilters, List<FilterOption> availableFilters, string message = "Data retrieved successfully")
        {
            var filteredData = FilteredResponse<T>.Create(data, appliedFilters, availableFilters);
            return Ok(ApiResponse<FilteredResponse<T>>.CreateSuccess(filteredData, message));
        }

        /// <summary>
        /// Creates a bulk operation response with detailed results for each item.
        /// </summary>
        /// <typeparam name="T">The type of data being returned for successful operations</typeparam>
        /// <param name="results">Individual results for each item</param>
        /// <param name="message">Summary message</param>
        /// <returns>Ok result with bulk operation response</returns>
        protected IActionResult CreateBulkOperationResponse<T>(List<BulkOperationResult<T>> results, string message = "")
        {
            var bulkResponse = BulkOperationResponse<T>.FromResults(results, message);
            return Ok(ApiResponse<BulkOperationResponse<T>>.CreateSuccess(bulkResponse, bulkResponse.Message));
        }

        /// <summary>
        /// Creates a standardized "no content" response for successful operations that don't return data.
        /// </summary>
        /// <param name="message">Success message</param>
        /// <returns>NoContent result with standardized response</returns>
        protected IActionResult NoContentResponse(string message = "Operation completed successfully")
        {
            return NoContent();
        }

        /// <summary>
        /// Creates a standardized "created" response for successful resource creation.
        /// </summary>
        /// <typeparam name="T">The type of data being returned</typeparam>
        /// <param name="data">The created resource data</param>
        /// <param name="actionName">The name of the action to redirect to</param>
        /// <param name="routeValues">Route values for the redirect</param>
        /// <param name="message">Success message</param>
        /// <returns>CreatedAtAction result with standardized response</returns>
        protected IActionResult CreatedResponse<T>(T data, string actionName, object routeValues, string message = "Resource created successfully")
        {
            return CreatedAtAction(actionName, routeValues, ApiResponse<T>.CreateSuccess(data, message));
        }

        /// <summary>
        /// Creates a standardized "accepted" response for operations that are being processed asynchronously.
        /// </summary>
        /// <param name="message">Acceptance message</param>
        /// <param name="location">Optional location where the result can be found</param>
        /// <returns>Accepted result with standardized response</returns>
        protected IActionResult AcceptedResponse(string message = "Operation accepted for processing", string? location = null)
        {
            var response = ApiResponse.CreateSuccess(message);
            if (!string.IsNullOrEmpty(location))
            {
                Response.Headers["Location"] = location;
            }
            return Accepted(response);
        }
    }
}
