# Project Management System - Backend API

A comprehensive, enterprise-grade .NET 8 Web API for project management with advanced features including authentication, authorization, caching, background job processing, and comprehensive error handling.

## 🚀 Features

### Core Functionality
- **Project Management**: Create, update, delete, and manage projects
- **Task Management**: Hierarchical task management with dependencies
- **User Management**: Role-based user management with Microsoft Identity
- **Activity Logging**: Comprehensive audit trail for all operations
- **File Management**: Document upload and management capabilities

### Advanced Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Fine-grained access control
- **Advanced Caching**: Memory-based caching with invalidation strategies
- **Background Job Processing**: Hangfire integration for async operations
- **Comprehensive Error Handling**: Global exception handling with detailed error responses
- **Request/Response Logging**: Structured logging with correlation IDs
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Data Validation**: Comprehensive input validation with custom attributes
- **Pagination & Filtering**: Advanced data retrieval with metadata

### Enterprise Features
- **Structured Logging**: JSON-based logging with sensitive data masking
- **Performance Monitoring**: Cache statistics and job monitoring
- **Database Optimization**: Entity Framework Core with optimized queries
- **Security**: Input validation, SQL injection prevention, XSS protection
- **Scalability**: Background job processing and caching strategies

## 🏗️ Architecture

### Project Structure
```
Backend/
├── Controllers/           # API Controllers
│   ├── Base/             # Base controller classes
│   └── ...               # Feature-specific controllers
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
│   └── ...               # Feature-specific services
├── Middleware/           # Custom middleware
├── Configuration/        # Configuration classes
└── Program.cs           # Application entry point
```

### Key Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic encapsulation
- **DTO Pattern**: Data transfer object separation
- **Middleware Pattern**: Cross-cutting concerns
- **Factory Pattern**: Object creation abstraction
- **Strategy Pattern**: Pluggable algorithms

## 🛠️ Technology Stack

- **.NET 8**: Latest .NET framework
- **ASP.NET Core**: Web API framework
- **Entity Framework Core**: ORM for data access
- **Microsoft Identity**: Authentication and authorization
- **JWT**: JSON Web Token authentication
- **Hangfire**: Background job processing
- **AutoMapper**: Object mapping
- **Swagger/OpenAPI**: API documentation
- **SQL Server**: Primary database
- **Memory Cache**: In-memory caching

## 📋 Prerequisites

- .NET 8 SDK
- SQL Server (LocalDB, Express, or Full)
- Visual Studio 2022 or VS Code
- Git

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project-management-system/Backend
```

### 2. Configure Database
Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ProjectManagementDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

### 3. Run Database Migrations
```bash
dotnet ef database update
```

### 4. Run the Application
```bash
dotnet run
```

The API will be available at:
- **API**: https://localhost:7001
- **Swagger UI**: https://localhost:7001/Swagger
- **Hangfire Dashboard**: https://localhost:7001/hangfire

## 🔧 Configuration

### AppSettings Configuration
```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-here",
    "Issuer": "ProjectManagementSystem",
    "Audience": "ProjectManagementUsers",
    "ExpirationHours": 24
  },
  "Cache": {
    "EnableCaching": true,
    "DefaultExpirationMinutes": 30,
    "MaxCacheSizeMB": 100,
    "EnableMonitoring": true
  },
  "BackgroundJobs": {
    "EnableBackgroundJobs": true,
    "MaxConcurrentJobs": 10,
    "DefaultJobTimeoutMinutes": 30,
    "MaxRetryAttempts": 3
  },
  "Logging": {
    "RequestResponse": {
      "EnableLogging": true,
      "LogRequestBody": true,
      "LogResponseBody": true,
      "MaskSensitiveData": true
    }
  }
}
```

## 🔐 Authentication & Authorization

### JWT Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Roles
- **Admin**: Full system access
- **Manager**: Project and team management
- **User**: Basic project and task access

### Default Admin Account
- **Email**: admin@projectmanagement.com
- **Password**: Admin123!

## 📚 API Documentation

### Core Endpoints

#### Projects
- `GET /api/Project` - Get all projects (paginated)
- `GET /api/Project/{id}` - Get project by ID
- `POST /api/Project` - Create new project
- `PUT /api/Project/{id}` - Update project
- `DELETE /api/Project/{id}` - Delete project

#### Tasks
- `GET /api/ProjectTask` - Get all tasks (paginated)
- `GET /api/ProjectTask/{id}` - Get task by ID
- `POST /api/ProjectTask` - Create new task
- `PUT /api/ProjectTask/{id}` - Update task
- `DELETE /api/ProjectTask/{id}` - Delete task

#### Users
- `GET /api/User` - Get all users (paginated)
- `GET /api/User/{id}` - Get user by ID
- `POST /api/User` - Create new user
- `PUT /api/User/{id}` - Update user
- `DELETE /api/User/{id}` - Delete user

### Advanced Endpoints

#### Cache Management
- `GET /api/Cache/statistics` - Get cache statistics
- `POST /api/Cache/clear` - Clear all cache
- `POST /api/Cache/invalidate/{entityType}` - Invalidate cache by entity type

#### Background Jobs
- `GET /api/BackgroundJob/statistics` - Get job statistics
- `GET /api/BackgroundJob` - Get all jobs (paginated)
- `POST /api/BackgroundJob/email` - Enqueue email job
- `POST /api/BackgroundJob/export` - Enqueue export job

#### Activity Logs
- `GET /api/ActivityLog` - Get activity logs (paginated)
- `GET /api/ActivityLog/{id}` - Get activity log by ID
- `GET /api/ActivityLog/user/{userId}` - Get user activity logs

## 💾 Caching

### Cache Features
- **Memory Cache**: In-memory caching with configurable expiration
- **Cache Invalidation**: Automatic cache clearing on entity changes
- **Cache Statistics**: Hit/miss ratios and memory usage monitoring
- **Pattern-Based Invalidation**: Remove cache entries by patterns

### Usage Examples
```csharp
// Get or set with factory pattern
var projects = await _cacheService.GetOrSetAsync(
    $"projects:user:{userId}", 
    async () => await _projectService.GetUserProjectsAsync(userId),
    30 // 30 minutes expiration
);

// Manual cache invalidation
await _cacheInvalidationService.InvalidateProjectAsync(projectId);
```

## 🔄 Background Jobs

### Job Types
- **Email Notification Job**: Asynchronous email sending
- **Data Export Job**: Long-running data export operations

### Job Features
- **Immediate Execution**: Enqueue jobs for immediate processing
- **Delayed Execution**: Schedule jobs for future execution
- **Recurring Jobs**: Cron-based recurring job scheduling
- **Job Monitoring**: Real-time job status and statistics
- **Retry Policies**: Automatic retry with configurable attempts
- **Job Cleanup**: Automatic cleanup of old completed jobs

### Usage Examples
```csharp
// Enqueue immediate job
var jobId = await _backgroundJobService.EnqueueJobAsync<EmailNotificationJob>(emailData);

// Schedule delayed job
var jobId = await _backgroundJobService.ScheduleJobAsync<DataExportJob>(
    exportRequest, TimeSpan.FromMinutes(30));

// Schedule recurring job
await _backgroundJobService.ScheduleRecurringJobAsync<CleanupJob>(
    cleanupData, "0 2 * * *", "daily-cleanup");
```

## 📊 Monitoring & Logging

### Structured Logging
- **JSON Format**: Machine-readable log format
- **Correlation IDs**: Request tracing across services
- **Sensitive Data Masking**: Automatic masking of sensitive information
- **Performance Metrics**: Request/response timing and performance data

### Log Levels
- **Debug**: Detailed debugging information
- **Information**: General application flow
- **Warning**: Potential issues
- **Error**: Error conditions
- **Critical**: Critical system failures

### Monitoring Endpoints
- **Cache Statistics**: `/api/Cache/statistics`
- **Job Statistics**: `/api/BackgroundJob/statistics`
- **Hangfire Dashboard**: `/hangfire`

## 🧪 Testing

### Unit Testing
```bash
dotnet test
```

### Integration Testing
```bash
dotnet test --filter Category=Integration
```

### API Testing
Use the Swagger UI at `/Swagger` for interactive API testing.

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Fine-grained access control
- **Input Validation**: Comprehensive input validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting protection

### Security Best Practices
- Use HTTPS in production
- Store secrets in secure configuration
- Regularly update dependencies
- Implement proper error handling
- Use parameterized queries
- Validate all inputs

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t project-management-api .

# Run Docker container
docker run -p 8080:80 project-management-api
```

### Azure Deployment
```bash
# Deploy to Azure App Service
az webapp up --name project-management-api --resource-group myResourceGroup
```

### Environment Variables
```bash
# Database connection
ConnectionStrings__DefaultConnection="Server=...;Database=...;"

# JWT settings
JwtSettings__SecretKey="your-secret-key"
JwtSettings__Issuer="ProjectManagementSystem"
JwtSettings__Audience="ProjectManagementUsers"

# Cache settings
Cache__EnableCaching="true"
Cache__DefaultExpirationMinutes="30"

# Background jobs
BackgroundJobs__EnableBackgroundJobs="true"
BackgroundJobs__MaxConcurrentJobs="10"
```

## 📈 Performance

### Performance Features
- **Caching**: Memory-based caching for frequently accessed data
- **Background Jobs**: Asynchronous processing for long-running operations
- **Database Optimization**: Optimized Entity Framework queries
- **Pagination**: Efficient data retrieval with pagination
- **Compression**: Response compression for large payloads

### Performance Monitoring
- **Cache Hit Ratios**: Monitor cache effectiveness
- **Job Processing Times**: Track background job performance
- **API Response Times**: Monitor endpoint performance
- **Database Query Performance**: EF Core query optimization

## 🤝 Contributing

### Development Guidelines
1. Follow C# coding conventions
2. Add XML documentation to public APIs
3. Write unit tests for new features
4. Update documentation for API changes
5. Use meaningful commit messages

### Code Quality
- **Naming Conventions**: Follow C# naming conventions
- **Error Handling**: Use custom exception types
- **Validation**: Implement comprehensive input validation
- **Logging**: Use structured logging with appropriate levels
- **Documentation**: Maintain comprehensive XML documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check the Swagger UI at `/Swagger`
- **Issues**: Create an issue in the repository
- **Email**: support@projectmanagement.com

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core project management features
- JWT authentication and authorization
- Advanced caching system
- Background job processing
- Comprehensive error handling
- Structured logging and monitoring
- Complete API documentation

---

**Built with ❤️ using .NET 8 and ASP.NET Core**

