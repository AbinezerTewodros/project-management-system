# Code Quality Standards & Best Practices

This document outlines the code quality standards, architectural patterns, and best practices implemented in the Project Management System backend.

## 🏗️ Architecture Patterns

### 1. Layered Architecture
```
┌─────────────────────────────────────┐
│           Controllers               │  ← API Layer
├─────────────────────────────────────┤
│            Services                 │  ← Business Logic Layer
├─────────────────────────────────────┤
│         Data Access Layer           │  ← Data Layer
├─────────────────────────────────────┤
│           Database                  │  ← Persistence Layer
└─────────────────────────────────────┘
```

### 2. Design Patterns Implemented

#### Repository Pattern
- **Purpose**: Abstract data access logic
- **Implementation**: Entity Framework Core DbContext
- **Benefits**: Testability, maintainability, separation of concerns

#### Service Layer Pattern
- **Purpose**: Encapsulate business logic
- **Implementation**: Service classes with dependency injection
- **Benefits**: Reusability, testability, business rule centralization

#### DTO Pattern
- **Purpose**: Separate data transfer objects from domain entities
- **Implementation**: Create/Update DTOs for API operations
- **Benefits**: API versioning, data validation, security

#### Factory Pattern
- **Purpose**: Object creation abstraction
- **Implementation**: AutoMapper for object mapping
- **Benefits**: Decoupling, testability, maintainability

#### Strategy Pattern
- **Purpose**: Pluggable algorithms
- **Implementation**: Different cache providers, job types
- **Benefits**: Extensibility, runtime algorithm selection

## 📝 Coding Standards

### 1. Naming Conventions

#### Classes and Interfaces
```csharp
// ✅ Correct
public class ProjectService : IProjectService
public interface ICacheService
public class CreateProjectDto

// ❌ Incorrect
public class projectService
public interface cacheService
public class createProjectDto
```

#### Methods and Properties
```csharp
// ✅ Correct
public async Task<Project> GetProjectByIdAsync(int id)
public string ProjectName { get; set; }
public bool IsActive { get; set; }

// ❌ Incorrect
public async Task<Project> getProjectById(int id)
public string projectName { get; set; }
public bool isActive { get; set; }
```

#### Constants and Enums
```csharp
// ✅ Correct
public const string DefaultCacheKey = "default";
public enum ProjectStatus { Planning, InProgress, Completed }

// ❌ Incorrect
public const string defaultCacheKey = "default";
public enum projectStatus { planning, inProgress, completed }
```

### 2. File Organization

#### Project Structure
```
Backend/
├── Controllers/           # API Controllers
│   ├── Base/             # Base controller classes
│   └── [Feature]/        # Feature-specific controllers
├── Data/                 # Data access layer
│   └── AppDbContext.cs   # Entity Framework context
├── Model/                # Data models
│   ├── Entities/         # Database entities
│   ├── Dto/              # Data Transfer Objects
│   ├── Validation/       # Custom validation attributes
│   └── Exceptions/       # Custom exception types
├── Services/             # Business logic layer
│   ├── Caching/          # Caching services
│   ├── BackgroundJobs/   # Background job processing
│   └── [Feature]/        # Feature-specific services
├── Middleware/           # Custom middleware
├── Configuration/        # Configuration classes
└── Program.cs           # Application entry point
```

#### File Naming
```
Controllers/
├── ProjectController.cs
├── UserController.cs
└── Base/
    └── BaseApiController.cs

Services/
├── ProjectService/
│   ├── IProjectService.cs
│   └── ProjectService.cs
└── Caching/
    ├── ICacheService.cs
    └── MemoryCacheService.cs
```

### 3. Code Documentation

#### XML Documentation
```csharp
/// <summary>
/// Service for managing project operations including CRUD operations,
/// project status management, and project analytics.
/// </summary>
public interface IProjectService
{
    /// <summary>
    /// Retrieves a paginated list of projects with optional filtering.
    /// </summary>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The number of items per page</param>
    /// <param name="searchTerm">Optional search term for filtering projects</param>
    /// <param name="status">Optional project status filter</param>
    /// <returns>A paginated response containing projects and metadata</returns>
    /// <exception cref="ArgumentException">Thrown when pageNumber or pageSize is invalid</exception>
    Task<PaginatedResponse<Project>> GetProjectsAsync(
        int pageNumber = 1, 
        int pageSize = 10, 
        string? searchTerm = null, 
        ProjectStatus? status = null);
}
```

#### Inline Comments
```csharp
// ✅ Good - Explains complex business logic
if (project.Status == ProjectStatus.Completed && project.EndDate < DateTime.UtcNow)
{
    // Project is overdue - send notification to project manager
    await _notificationService.SendOverdueNotificationAsync(project.Id);
}

// ❌ Bad - Obvious code doesn't need comments
int count = 0; // Initialize count to zero
count++; // Increment count by one
```

### 4. Error Handling

#### Custom Exceptions
```csharp
// ✅ Custom exception with context
public class ProjectNotFoundException : NotFoundException
{
    public ProjectNotFoundException(int projectId) 
        : base("Project", projectId)
    {
    }
}

// ✅ Exception with business context
public class InvalidProjectStatusException : BusinessRuleException
{
    public InvalidProjectStatusException(ProjectStatus currentStatus, ProjectStatus targetStatus)
        : base("INVALID_STATUS_TRANSITION", 
               $"Cannot transition project from {currentStatus} to {targetStatus}")
    {
    }
}
```

#### Exception Handling Pattern
```csharp
public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto updateDto)
{
    try
    {
        // Validate input
        if (!ModelState.IsValid)
        {
            return BadRequestResponse("Invalid project data");
        }

        // Business logic
        var success = await _projectService.UpdateProjectAsync(id, updateDto);
        
        if (!success)
        {
            return NotFoundResponse($"Project with ID {id} not found");
        }

        return NoContentResponse();
    }
    catch (Exception ex)
    {
        return HandleException(ex, "updating project", id);
    }
}
```

### 5. Validation

#### Input Validation
```csharp
public class CreateProjectDto
{
    [Required(ErrorMessage = "Project name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Project name must be between 3 and 100 characters")]
    public string ProjectName { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Start date is required")]
    [FutureDate(ErrorMessage = "Start date must be in the future")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "End date is required")]
    [FutureDate(ErrorMessage = "End date must be in the future")]
    public DateTime EndDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Budget must be a positive number")]
    public decimal Budget { get; set; }
}
```

#### Custom Validation Attributes
```csharp
public class FutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value == null)
            return ValidationResult.Success;

        if (value is DateTime dateValue)
        {
            if (dateValue <= DateTime.UtcNow)
            {
                return new ValidationResult(ErrorMessage ?? "Date must be in the future");
            }
        }

        return ValidationResult.Success;
    }
}
```

## 🔧 Performance Best Practices

### 1. Database Optimization

#### Query Optimization
```csharp
// ✅ Good - Use Include for related data
var projects = await _context.Projects
    .Include(p => p.Tasks)
    .Include(p => p.Manager)
    .AsSplitQuery() // For complex queries
    .ToListAsync();

// ✅ Good - Use projection for large datasets
var projectSummaries = await _context.Projects
    .Select(p => new ProjectSummary
    {
        Id = p.Id,
        Name = p.ProjectName,
        Status = p.Status,
        TaskCount = p.Tasks.Count
    })
    .ToListAsync();
```

#### Pagination
```csharp
// ✅ Good - Efficient pagination
public async Task<PaginatedResponse<T>> GetPaginatedAsync<T>(
    IQueryable<T> query, 
    int pageNumber, 
    int pageSize)
{
    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return new PaginatedResponse<T>
    {
        Data = items,
        PageNumber = pageNumber,
        PageSize = pageSize,
        TotalCount = totalCount,
        TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
    };
}
```

### 2. Caching Strategy

#### Cache Key Patterns
```csharp
// ✅ Good - Consistent cache key patterns
public static class CacheKeys
{
    public const string ProjectPrefix = "project";
    public const string UserPrefix = "user";
    
    public static string Project(int id) => $"{ProjectPrefix}:{id}";
    public static string UserProjects(string userId) => $"{UserPrefix}:{userId}:projects";
    public static string ProjectTasks(int projectId) => $"{ProjectPrefix}:{projectId}:tasks";
}
```

#### Cache Invalidation
```csharp
// ✅ Good - Pattern-based cache invalidation
public async Task InvalidateProjectCacheAsync(int projectId)
{
    var patterns = new[]
    {
        $"*project:{projectId}*",
        $"*projects*{projectId}*",
        $"*user*:projects*" // Invalidate user project lists
    };

    foreach (var pattern in patterns)
    {
        await _cacheService.RemoveByPatternAsync(pattern);
    }
}
```

### 3. Background Job Processing

#### Job Design
```csharp
// ✅ Good - Well-structured background job
public class EmailNotificationJob : IBackgroundJob
{
    public async Task ExecuteAsync(object jobData, CancellationToken cancellationToken = default)
    {
        if (jobData is not EmailNotificationData emailData)
        {
            throw new ArgumentException("Invalid job data type");
        }

        _logger.LogInformation("Sending email to {Recipient}", emailData.RecipientEmail);

        // Simulate email sending with cancellation support
        await Task.Delay(2000, cancellationToken);

        _logger.LogInformation("Email sent successfully to {Recipient}", emailData.RecipientEmail);
    }

    public string GetJobName() => "Email Notification Job";
    public int GetMaxRetryAttempts() => 3;
    public TimeSpan GetRetryDelay() => TimeSpan.FromMinutes(5);
}
```

## 🧪 Testing Standards

### 1. Unit Testing

#### Test Structure
```csharp
[Fact]
public async Task GetProject_WithValidId_ReturnsProject()
{
    // Arrange
    var project = new Project { Id = 1, ProjectName = "Test Project" };
    _mockProjectService.Setup(x => x.GetProjectByIdAsync(1))
        .ReturnsAsync(project);

    // Act
    var result = await _controller.GetProject(1);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var apiResponse = Assert.IsType<ApiResponse<Project>>(okResult.Value);
    Assert.True(apiResponse.Success);
    Assert.Equal(1, apiResponse.Data.Id);
}
```

#### Test Naming Convention
```csharp
// ✅ Good - Clear test naming
[Fact]
public async Task CreateProject_WithValidData_ReturnsCreatedResult()

[Fact]
public async Task UpdateProject_WithInvalidId_ReturnsNotFound()

[Fact]
public async Task DeleteProject_WithValidId_ReturnsNoContent()
```

### 2. Integration Testing

#### Test Setup
```csharp
public class ProjectControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProjectControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace with in-memory database
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase");
                });
            });
        });

        _client = _factory.CreateClient();
    }
}
```

## 🔒 Security Best Practices

### 1. Input Validation
```csharp
// ✅ Good - Comprehensive input validation
[Required(ErrorMessage = "Project name is required")]
[StringLength(100, MinimumLength = 3)]
[RegularExpression(@"^[a-zA-Z0-9\s\-_]+$", ErrorMessage = "Project name contains invalid characters")]
public string ProjectName { get; set; } = string.Empty;
```

### 2. Authorization
```csharp
// ✅ Good - Role-based authorization
[Authorize(Roles = "Admin,Manager")]
public async Task<IActionResult> CreateProject(CreateProjectDto createDto)

[Authorize(Roles = "Admin")]
public async Task<IActionResult> DeleteProject(int id)
```

### 3. Data Protection
```csharp
// ✅ Good - Sensitive data handling
public class LoggingOptions
{
    public bool MaskSensitiveData { get; set; } = true;
    public string[] SensitiveFields { get; set; } = { "password", "token", "secret" };
}
```

## 📊 Monitoring and Logging

### 1. Structured Logging
```csharp
// ✅ Good - Structured logging with context
_logger.LogInformation("Project {ProjectId} updated by user {UserId}", 
    projectId, userId);

_logger.LogWarning("Project {ProjectId} is overdue by {DaysOverdue} days", 
    projectId, daysOverdue);

_logger.LogError(ex, "Failed to update project {ProjectId}", projectId);
```

### 2. Performance Monitoring
```csharp
// ✅ Good - Performance tracking
public async Task<IActionResult> GetProjects(int pageNumber, int pageSize)
{
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        var result = await _projectService.GetProjectsAsync(pageNumber, pageSize);
        
        stopwatch.Stop();
        _logger.LogInformation("GetProjects completed in {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
            
        return SuccessResponse(result);
    }
    catch (Exception ex)
    {
        stopwatch.Stop();
        _logger.LogError(ex, "GetProjects failed after {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
        throw;
    }
}
```

## 🚀 Deployment and Configuration

### 1. Environment Configuration
```csharp
// ✅ Good - Environment-specific configuration
public static IHostBuilder CreateHostBuilder(string[] args) =>
    Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(webBuilder =>
        {
            webBuilder.UseStartup<Startup>();
        })
        .ConfigureAppConfiguration((context, config) =>
        {
            config.AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.json", 
                optional: true, reloadOnChange: true);
        });
```

### 2. Health Checks
```csharp
// ✅ Good - Health check implementation
public class DatabaseHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check database connectivity
            await _context.Database.CanConnectAsync(cancellationToken);
            return HealthCheckResult.Healthy("Database is accessible");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database is not accessible", ex);
        }
    }
}
```

## 📋 Code Review Checklist

### Before Submitting Code
- [ ] All tests pass
- [ ] Code follows naming conventions
- [ ] XML documentation is complete
- [ ] Error handling is implemented
- [ ] Input validation is in place
- [ ] Logging is appropriate
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] No hardcoded values
- [ ] Configuration is externalized
- [ ] Code is properly formatted
- [ ] No unused imports or variables
- [ ] Exception handling is comprehensive
- [ ] Async/await is used correctly
- [ ] Database queries are optimized

### Code Review Questions
1. Is the code readable and maintainable?
2. Are there any potential performance issues?
3. Is error handling comprehensive?
4. Are security considerations addressed?
5. Is the code testable?
6. Are there any code smells or anti-patterns?
7. Is the documentation complete and accurate?
8. Are there any potential race conditions?
9. Is the code following SOLID principles?
10. Are there any memory leaks or resource disposal issues?

---

**Remember**: Code quality is not just about functionality, but about maintainability, readability, and long-term sustainability. Always write code as if someone else will maintain it.

