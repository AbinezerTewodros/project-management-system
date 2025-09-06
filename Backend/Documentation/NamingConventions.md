# Naming Conventions

This document outlines the standardized naming conventions used throughout the Project Management System API.

## Controller Naming

### Route Patterns
- **GET /api/{controller}** - Get all resources (e.g., `/api/projects`)
- **GET /api/{controller}/{id}** - Get specific resource (e.g., `/api/projects/123`)
- **GET /api/{controller}/by-{filter}/{value}** - Get filtered resources (e.g., `/api/projects/by-priority/high`)
- **POST /api/{controller}** - Create new resource
- **PUT /api/{controller}/{id}** - Update specific resource
- **DELETE /api/{controller}/{id}** - Delete specific resource
- **POST /api/{controller}/{id}/{action}** - Custom actions (e.g., `/api/projects/123/archive`)

### Method Names
- `Get{Resource}s()` - Get all resources
- `Get{Resource}(int id)` - Get specific resource
- `Get{Resource}sBy{Filter}(string filter)` - Get filtered resources
- `Create{Resource}([FromBody] Create{Resource}Dto dto)` - Create new resource
- `Update{Resource}(int id, [FromBody] Update{Resource}Dto dto)` - Update resource
- `Delete{Resource}(int id)` - Delete resource
- `{Action}{Resource}(int id)` - Custom actions (e.g., `ArchiveProject`, `RestoreProject`)

## DTO Naming

### DTO Class Names
- `Create{Resource}Dto` - For creating new resources
- `Update{Resource}Dto` - For updating existing resources
- `{Resource}Dto` - For reading/returning resources
- `{Resource}ReadDto` - Alternative for read-only DTOs

### Property Names
- Use **PascalCase** for all properties
- Use descriptive names that clearly indicate the purpose
- Boolean properties should start with "Is", "Has", "Can", etc.
- Collections should be plural (e.g., `Projects`, `Tasks`)

## Service Naming

### Interface Names
- `I{Resource}Service` - Main service interface
- `I{Resource}{Operation}Service` - Specialized service interfaces (e.g., `ITaskValidationService`)

### Method Names
- `Get{Resource}Async()` - Get all resources
- `Get{Resource}ByIdAsync(int id)` - Get specific resource
- `Create{Resource}Async({Resource}Dto dto, string userId)` - Create resource
- `Update{Resource}Async(int id, {Resource}Dto dto, string userId)` - Update resource
- `Delete{Resource}Async(int id)` - Delete resource
- `{Action}{Resource}Async(int id, string userId)` - Custom actions

## Entity Naming

### Entity Class Names
- Use singular form (e.g., `Project`, `Task`, `User`)
- Use **PascalCase**

### Property Names
- Use **PascalCase** for all properties
- Navigation properties should match the related entity name
- Foreign key properties should follow pattern: `{RelatedEntity}Id`

## Database Naming

### Table Names
- Use plural form (e.g., `Projects`, `Tasks`, `Users`)
- Use **PascalCase**

### Column Names
- Use **PascalCase** for all columns
- Primary keys: `Id`
- Foreign keys: `{RelatedEntity}Id`
- Audit fields: `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`

## Variable Naming

### Local Variables
- Use **camelCase** for local variables
- Use descriptive names that indicate purpose
- Avoid abbreviations unless widely understood

### Private Fields
- Use **camelCase** with underscore prefix: `_fieldName`
- Use descriptive names that indicate purpose

### Constants
- Use **PascalCase** with descriptive names
- Consider using `const` for compile-time constants

## Method Parameter Naming

### Standard Parameters
- `id` - Resource identifier
- `dto` - Data transfer object
- `userId` - User identifier
- `pageNumber` - Pagination page number
- `pageSize` - Pagination page size

### Query Parameters
- Use **camelCase** for query parameter names
- Use descriptive names that indicate the filter purpose

## Response Naming

### API Response Structure
- Use `ApiResponse<T>` for all API responses
- Success responses: `ApiResponse<T>.Success(data, message)`
- Error responses: `ApiResponse<T>.Error(message, errors)`

### Response Properties
- `Success` - Boolean indicating operation success
- `Message` - Human-readable message
- `Data` - Response payload
- `Errors` - List of error messages
- `Timestamp` - UTC timestamp
- `CorrelationId` - Request tracking identifier

## Exception Naming

### Custom Exception Classes
- `{Operation}Exception` - Specific operation exceptions
- `{Resource}NotFoundException` - Resource not found
- `{Resource}ValidationException` - Validation errors
- `{Resource}UnauthorizedException` - Authorization errors

## Configuration Naming

### Configuration Classes
- `{Feature}Settings` - Configuration settings classes
- `{Feature}Options` - Options classes

### Configuration Properties
- Use **PascalCase** for all properties
- Use descriptive names that indicate the setting purpose

## Examples

### Controller Example
```csharp
[ApiController]
[Route("api/[controller]")]
public class ProjectController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProjects() { }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id) { }
    
    [HttpGet("by-priority/{priority}")]
    public async Task<IActionResult> GetProjectsByPriority(string priority) { }
    
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto) { }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto dto) { }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id) { }
    
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> ArchiveProject(int id) { }
}
```

### DTO Example
```csharp
public class CreateProjectDto
{
    public string ProjectName { get; set; }
    public string ProjectOwner { get; set; }
    public string ProjectOwnerEmail { get; set; }
    public DateTime DueDate { get; set; }
    public string Priority { get; set; }
    public string Status { get; set; }
}
```

### Service Example
```csharp
public interface IProjectService
{
    Task<List<ProjectDto>> GetProjectsAsync(string department);
    Task<ProjectDto> GetProjectByIdAsync(int id);
    Task<ProjectDto> CreateProjectAsync(CreateProjectDto dto, string userId);
    Task<ProjectDto> UpdateProjectAsync(int id, UpdateProjectDto dto, string username);
    Task<bool> DeleteProjectAsync(int id);
}
```

